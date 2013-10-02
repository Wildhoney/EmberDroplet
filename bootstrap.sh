sudo apt-get update
sudo apt-get install python-software-properties python g++ make -y
sudo apt-get update
sudo apt-get install git-core -y
sudo apt-get npm -y
sudo npm install grunt -g
cd /vagrant
node example/node-server/server.js