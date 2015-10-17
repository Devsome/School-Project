Multi-Chat
==========

Ein Schulprojekt mit socket.io und node.js


## Was kann dieser Chat ?
- Man kann mit mehreren Leuten gleichzeitig schreiben
- Eigene Raum erstellen
- Verschiedene vorgefertigte Gruppen gibt es
- Privatenachrichten versenden


## Was braucht man ?
Um es auf dem Server zu starten braucht man
Dies wird aber alles schon in der bootstrap.sh ausgeführt
- node.js mit NPM
- socket.io
- express


## Wie installiere ich es ?
In dem gleichen Ordner ausführen wo auch die Datein liegen (cd /vagrant)
- npm install socket.io
- npm install express


## Hinweis
- Sie können am besten den Server in einem screen starten
- screen -s "Chat"
- Danach in den Ordner gehen wo Sie sich das Spiel befindet
- bash run
- ctrl + a + d
- Danach ist der Prozesse detached
