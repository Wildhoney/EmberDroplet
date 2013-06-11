/**
 * @module App
 * @class CatModel
 * @type Ember.Object
 * @extends Ember.Object
 */
App.CatModel = Ember.Object.extend({

    /**
     * @property name
     * @type {String}
     */
    name: null,

    /**
     * @property country
     * @type {String}
     */
    country: null,

    /**
     * @property age
     * @type {Number}
     */
    age: null,

    /**
     * @property colours
     * @type []
     */
    colours: [],

    /**
     * @property cuteness
     * @type {Number}
     */
    cuteness: null

});