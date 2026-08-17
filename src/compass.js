import * as THREE from 'three';

export class Compass {
    constructor() {
        this.compassElement = document.querySelector("#compass");
        this.stripElement = document.querySelector("#compass-strip");

        this.compassDirections = {
            0: "N",
            90: "E",
            180: "S",
            270: "W",
        }

        this.lookDirection = new THREE.Vector3();
        this.horizontalFov = 180;
        this.pixelsPerDegree = this.compassElement.clientWidth / this.horizontalFov;

        this.markers = [];

        const interval = 15;
        for (let degree = -360; degree < 720; degree += interval) {
            const marker = document.createElement("div");
            marker.classList.add("compass-marker");
            marker.style.left = `${degree * this.pixelsPerDegree}px`;
            const normalizedDegree = ((degree % 360) + 360) % 360;
            const label = this.compassDirections[normalizedDegree];

            if (label) {
                const labelElement = document.createElement('div');

                labelElement.classList.add('compass-label');
                labelElement.textContent = label;

                marker.appendChild(labelElement);
            } else {
                const tick = document.createElement('div');

                tick.classList.add('compass-tick');

                marker.appendChild(tick);

                const labelElement = document.createElement('div');

                labelElement.classList.add('compass-tick-label');
                labelElement.textContent = `${normalizedDegree}`;

                marker.appendChild(labelElement);
            }

            this.markers.push({marker, degree});

            this.stripElement.appendChild(marker);
        }
    }

    update(gameState) {
        const heading = this.getHeading(gameState.camera);
        const d = THREE.MathUtils.radToDeg(heading);
        this.stripElement.style.transform = `translateX(${-d * this.pixelsPerDegree}px)`;
    }
    
    getHeading(camera) {
        camera.getWorldDirection(this.lookDirection);
        
        this.lookDirection.y = 0;
        this.lookDirection.normalize();
        
        let heading = Math.atan2(this.lookDirection.x, -this.lookDirection.z);
        
        if (heading < 0) {
            heading += Math.PI * 2;
        }

        return heading;
    }
    
    resize() {
        this.pixelsPerDegree = this.compassElement.clientWidth / this.horizontalFov;
        this.markers.forEach((e, i) => {
            e.marker.style.left = `${e.degree * this.pixelsPerDegree}px`;
        });
    }    
}