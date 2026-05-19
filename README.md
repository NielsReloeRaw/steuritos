---
Overzicht

Spelstroom:
1. Setup (3 stappen): aantal teams → teamnamen + spelers → doelpunten (25 / 50 / eigen getal)
2. Wachtscherm: toont welk team en welke speler aan de beurt is, met "Start" knop
3. Speelscherm: 5 begrippen, aftellende timer (30s), klik op een begrip om het af te vinken — als alles geraden is stopt de beurt automatisch
4. Beurt afgelopen: punten tonen, volgende team
5. Game over: wanneer doelpuntenaantal bereikt is of alle begrippen op zijn

Beheerpagina (/ → "Beheer begrippen"): begrippen toevoegen (één voor één of bulk via tekstblok), zoeken, verwijderen.

---
Lokaal testen

# In één terminal: backend
cd backend && node server.js

# In tweede terminal: frontend dev server
cd frontend && npm run dev
# Ga naar http://localhost:5173

Deployen naar Kubernetes

# 1. Frontend bouwen + inpakken in backend
cd frontend && npm run build

# 2. Docker image bouwen
cd ..
docker build -t steuritos:latest .

# 3. Image naar je cluster pushen (pas de naam aan voor jouw registry)
docker tag steuritos:latest ghcr.io/nielsreloeraw/steuritos:latest
docker push ghcr.io/nielsreloeraw/steuritos:latest

# 4. Kubernetes resources aanmake
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

De PersistentVolumeClaim zorgt dat de begrippenlijst bewaard blijft bij een herstart van de pod. Wil je de app van buiten het cluster bereiken, dan voeg je
een Ingress toe of verander je het Service type naar LoadBalancer.