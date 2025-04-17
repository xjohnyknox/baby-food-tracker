#!/bin/bash

# Construir la imagen Docker
echo "Construyendo la imagen Docker..."
docker build -t baby-food-tracker .

# Ejecutar el contenedor
echo "Iniciando el contenedor..."
docker run -p 3000:3000 --name baby-food-tracker-container baby-food-tracker

# Instrucciones para el usuario
echo "
La aplicación Baby Food Tracker está ejecutándose en http://localhost:3000

Para detener el contenedor:
docker stop baby-food-tracker-container

Para eliminar el contenedor:
docker rm baby-food-tracker-container
"

