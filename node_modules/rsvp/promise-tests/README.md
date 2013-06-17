# A Promises/A Test Suite

Inspired by ["You're Missing the Point of Promises,"][essay] I wrote this test suite for the [CommonJS Promises/A][]
spec and some of its common extensions. If you're not passing this, something's wrong.


[essay]: https://gist.github.com/3889970
[CommonJS Promises/A]: http://wiki.commonjs.org/wiki/Promises/A


## How To Run

The tests run in a Node.js environment; make sure you have that installed.

### Adapters

In order to test your promise library, you must expose a very minimal adapter interface. These are written as Node.js
modules with a few well-known exports. Check out some examples in `lib/adapters`, and read the `README.md` file there
for guidance and a more in-depth explanation.

### From the CLI

This package comes with a command-line interface that can be used either by installing it globally with
`npm install promise-tests -g` or by including it in your `package.json`'s `devDependencies` and using npm's `scripts`
feature. In the latter case, your setup might look something like

```json
{
    "devDependencies": {
        "promise-tests": "*"
    },
    "scripts": {
        "test": "run-my-own-tests && promise-tests all test/my-promise-tests-adapter"
    }
}
```

The CLI takes two arguments: the test suite you want to run (either `promises-a` or `all`), and the filename of your
adapter file, relative to the current working directory. If either of these is missing, it will prompt you for them
interactively.

### Programmatically

The main export of this package is a function that allows you to run the tests against an adapter:

```js
var promiseTests = require("promise-tests");

promiseTests(adapter, ["promises-a"], function () {
    // All done, output in the CLI.
});
```

The second parameter is an array containing which tests you want to run (see below).


## Other Included Tests

Promises/A is a rather bare spec. Most promise implementations have converged on certain semantics which make working
with promises much more pleasant. Those tests are included in other files in the `lib` directory, and can be run with
through the CLI with the `all` option, or individually with the programmatic option.

### Returning a Promise from a Handler

There is, unfortunately, a very common and important behavior of thenables that is *not* in the Promises/A spec: what
happens when one of your handlers returns a promise? For concreteness, let's use this example:

```js
var a = b.then(function () {
    return c; // `c` is a promise
});
```

Most implementations have converged on the answer that `a` should be resolved in the same way as `c`, i.e.

- `a` should be fulfilled if and only if `c` is fulfilled, and with `c`'s fulfillment value
- `a` should be rejected if and only if `c` is rejected, and with `c`'s rejection reason

Unfortunately the Promises/A spec alone seems to imply that `a` should always be fulfilled, with the promise `c` as its
fulfillment value!

Tests for this spec extension are included as `returning-a-promise`.

### Resolution Races

As described in the "Requirements" section of the [CommonJS wiki on Promises][wiki], number 3.2, you should be able to
distribute the resolver to multiple mutually-suspicious consumers, and have them "race" to resolve the promise. This is
somewhat analogous to the synchronous case where there can be a "race" between multiple `return` and `throw` statements
within the same function. It's useful for implementing cases like a race between a timeout rejection and a normal
resolution, as in Q's [`Q.timeout(promise, ms)`][timeout]. And it has some security implications in the
[object-capability][] sense.

In particular, this means that resolvers (i.e. someone with only the ability to fulfill or reject a promise) should not
be able to observe the state of the promise so far. For example, attempting to resolve multiple times should not throw
an error, since that would be a way for someone with only resolver capabilities to determine a promise's state. However,
the Promises/A spec itself failed to capture this requirement, even though the CommonJS group considered it important,
so implementations are still Promises/A conforming if they throw errors.

Tests for this spec extension are included as `resolution-races`.


[object-capability]: http://en.wikipedia.org/wiki/Object-capability_model
[wiki]: http://wiki.commonjs.org/wiki/Promises
[timeout]: https://github.com/kriskowal/q/blob/c2c7353dfa5341b1f57bd5f4c3ac40064bf3e63f/q.js#L1445-1465

### Always Async

It's generally more predictable if you're guaranteed that your handlers are always called in a future turn of the event
loop. This allows you to know the execution order of code like the following with confidence:

```js
console.log("1");

promise.then(function () {
    console.log("3");
});

console.log("2");
```

If a promise library does not guarantee asynchronicity, then in some cases the sequence will be 1, 2, 3, while in others
it will be 1, 3, 2. This makes code hard to follow as your assumptions about what is true inside the handler do not
always hold.

For example, consider a promise-returning library for storing data that does not guarantee asynchronicity. You may be
using the `localStorage` backing store, which is always synchronous, leading you to expect the 1, 3, 2 sequence and
write code that assumes changes were committed by the time 2 gets logged to the console. But later, you take advantage
of this hypothetical library's great flexibility to switch to an `IndexedDB` backing store, which happens to be
always-asynchronous. Now your code takes the 1, 2, 3 path, breaking your earlier assumption and introducing tons of
subtle bugs.

To avoid this problem, leading promise libraries are sure to always call handlers in the next turn of the event loop,
using mechanisms like `process.nextTick` in Node or `setTimeout(..., 0)` in browsers. That way, promise producers can
resolve their promises either synchronously or asynchronously, without worrying that promise consumers will face
different behavior.

Tests for this spec extension are included as `always-async`


## Room for Improvement

I'd like this to run more easily in the browser, for libraries like [Ember][] or jQuery (even though in the latter case
I've hacked together a [jsdom][]-based solution).

There are other spec extensions that would be useful to test, e.g. the behavior of deferreds, which are more or less the
canonical promise-creation technique. There are a few subtleties there regarding resolving a deferred with a pending
promise that not everyone gets right.


[Ember]: https://github.com/emberjs/ember.js/commit/f7ac080db3a2a15f5814dc26fc86712cf7d252c8
[jsdom]: https://github.com/tmpvar/jsdom
