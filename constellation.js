/* Exact constellation animation shared with the main page. */
class ConstellationNetwork {
                constructor(canvas) {
                    this.canvas = canvas;
                    this.section = canvas.closest(".constellation-section");
                    this.context = canvas.getContext("2d", { alpha: true });
                    this.variant = canvas.dataset.constellation;
                    this.clusters = [];
                    this.pointer = { x: 0, y: 0, active: false };
                    this.visible = true;
                    this.frame = 0;
                    this.finePointer = matchMedia("(pointer:fine)").matches;
                    this.reducedMotion = matchMedia("(prefers-reduced-motion:reduce)").matches;

                    this.resizeObserver = new ResizeObserver(() => this.resize());
                    this.resizeObserver.observe(this.section);

                    this.intersectionObserver = new IntersectionObserver(([entry]) => {
                        this.visible = entry.isIntersecting;
                        if (this.visible && !this.frame) this.animate(performance.now());
                    }, { rootMargin: "100px" });
                    this.intersectionObserver.observe(this.section);

                    if (this.finePointer && !this.reducedMotion) {
                        this.section.addEventListener("pointermove", (event) => this.updatePointer(event), { passive: true });
                        this.section.addEventListener("pointerleave", () => { this.pointer.active = false; }, { passive: true });
                    }

                    this.resize();
                }

                resize() {
                    const bounds = this.section.getBoundingClientRect();
                    this.width = Math.max(1, bounds.width);
                    this.height = Math.max(1, bounds.height);
                    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
                    this.canvas.width = Math.round(this.width * this.dpr);
                    this.canvas.height = Math.round(this.height * this.dpr);
                    this.canvas.style.width = `${this.width}px`;
                    this.canvas.style.height = `${this.height}px`;
                    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
                    this.buildClusters();
                    this.draw(performance.now());
                }

                buildClusters() {
                    const mobile = this.width < 640;
                    const clusterCount = this.variant === "companies" ? (mobile ? 12 : 28) : (mobile ? 7 : 16);
                    const now = performance.now();
                    this.clusters = Array.from({ length: clusterCount }, (_, clusterIndex) => {
                        const centerX = (.03 + Math.random() * .94) * this.width;
                        const centerY = (.08 + Math.random() * .84) * this.height;
                        const radius = mobile ? 22 + Math.random() * 28 : 28 + Math.random() * 42;
                        const particleCount = 3 + Math.floor(Math.random() * 5);
                        const cluster = Array.from({ length: particleCount }, (_, index) => {
                            const angle = (index / particleCount) * Math.PI * 2 + Math.random() * .7;
                            const distance = radius * (.28 + Math.random() * .72);
                            const particle = {
                                centerX,
                                centerY,
                                radius,
                                baseX: centerX + Math.cos(angle) * distance,
                                baseY: centerY + Math.sin(angle) * distance,
                                x: centerX + Math.cos(angle) * distance,
                                y: centerY + Math.sin(angle) * distance,
                                offsetX: 0,
                                offsetY: 0,
                                opacity: 0,
                                clusterIndex
                            };
                            this.resetParticle(particle, now, true);
                            return particle;
                        });
                        return cluster;
                    });
                }

                resetParticle(particle, time, initial = false) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = particle.radius * (.22 + Math.random() * .82);
                    particle.baseX = particle.centerX + Math.cos(angle) * distance;
                    particle.baseY = particle.centerY + Math.sin(angle) * distance;
                    particle.x = particle.baseX;
                    particle.y = particle.baseY;
                    particle.offsetX = 0;
                    particle.offsetY = 0;
                    particle.opacity = 0;
                    const opacityScale = this.variant === "companies" ? .62 : 1;
                    particle.maxOpacity = (.18 + Math.random() * .24) * opacityScale;
                    particle.size = Math.random() < .08 ? 2.5 + Math.random() * .5 : 1 + Math.random() * 1.5;
                    particle.fadeInDuration = 1000 + Math.random() * 2000;
                    particle.visibleDuration = 3000 + Math.random() * 5000;
                    particle.fadeOutDuration = 1000 + Math.random() * 2000;
                    particle.respawnDelay = 500 + Math.random() * 2500;
                    particle.lifeDuration = particle.fadeInDuration + particle.visibleDuration + particle.fadeOutDuration;
                    const travelAngle = Math.random() * Math.PI * 2;
                    const travelDistance = 100 + Math.random() * 30;
                    particle.vx = Math.cos(travelAngle) * travelDistance / particle.lifeDuration;
                    particle.vy = Math.sin(travelAngle) * travelDistance / particle.lifeDuration;
                    particle.phase = Math.random() * Math.PI * 2;
                    particle.drift = 1.5 + Math.random() * 3.5;
                    particle.birthTime = initial
                        ? time - Math.random() * particle.lifeDuration
                        : time + particle.respawnDelay;
                }

                updatePointer(event) {
                    const bounds = this.section.getBoundingClientRect();
                    this.pointer.x = event.clientX - bounds.left;
                    this.pointer.y = event.clientY - bounds.top;
                    this.pointer.active = true;
                }

                draw(time) {
                    const context = this.context;
                    context.clearRect(0, 0, this.width, this.height);

                    for (const cluster of this.clusters) {
                        for (const particle of cluster) {
                            let age = time - particle.birthTime;
                            if (age >= particle.lifeDuration) {
                                this.resetParticle(particle, time);
                                age = -particle.respawnDelay;
                            }

                            if (age < 0) {
                                particle.opacity = 0;
                            } else if (age < particle.fadeInDuration) {
                                particle.opacity = particle.maxOpacity * (age / particle.fadeInDuration);
                            } else if (age < particle.fadeInDuration + particle.visibleDuration) {
                                particle.opacity = particle.maxOpacity;
                            } else {
                                const fadeAge = age - particle.fadeInDuration - particle.visibleDuration;
                                particle.opacity = particle.maxOpacity * Math.max(0, 1 - fadeAge / particle.fadeOutDuration);
                            }

                            const activeAge = Math.max(0, age);
                            let ambientX = this.reducedMotion ? 0 : particle.vx * activeAge + Math.sin(time * .00018 + particle.phase) * particle.drift;
                            let ambientY = this.reducedMotion ? 0 : particle.vy * activeAge + Math.cos(time * .00015 + particle.phase) * particle.drift;
                            const ambientDistance = Math.hypot(ambientX, ambientY);
                            const maxTravel = 130;
                            if (ambientDistance > maxTravel) {
                                ambientX = ambientX / ambientDistance * maxTravel;
                                ambientY = ambientY / ambientDistance * maxTravel;
                            }
                            let targetX = 0;
                            let targetY = 0;
                            let proximity = 0;

                            if (this.pointer.active && particle.opacity > 0) {
                                const naturalX = particle.baseX + ambientX;
                                const naturalY = particle.baseY + ambientY;
                                const dx = this.pointer.x - naturalX;
                                const dy = this.pointer.y - naturalY;
                                const distance = Math.hypot(dx, dy);
                                const radius = 125;
                                if (distance < radius && distance > 0) {
                                    proximity = 1 - distance / radius;
                                    const magneticPull = 9 * proximity * proximity;
                                    targetX = dx / distance * magneticPull;
                                    targetY = dy / distance * magneticPull;
                                }
                            }

                            particle.offsetX += (targetX - particle.offsetX) * .055;
                            particle.offsetY += (targetY - particle.offsetY) * .055;
                            particle.x = particle.baseX + ambientX + particle.offsetX;
                            particle.y = particle.baseY + ambientY + particle.offsetY;
                            particle.proximity = proximity;
                        }

                        for (let i = 0; i < cluster.length; i++) {
                            for (let j = i + 1; j < cluster.length; j++) {
                                const first = cluster[i];
                                const second = cluster[j];
                                const distance = Math.hypot(first.x - second.x, first.y - second.y);
                                const maxDistance = 82;
                                const sharedOpacity = Math.min(first.opacity, second.opacity);
                                if (distance < maxDistance && sharedOpacity > .005) {
                                    context.beginPath();
                                    context.moveTo(first.x, first.y);
                                    context.lineTo(second.x, second.y);
                                    context.lineWidth = .5;
                                    context.strokeStyle = `rgba(196,166,202,${(1 - distance / maxDistance) * sharedOpacity * .58})`;
                                    context.stroke();
                                }
                            }
                        }

                        for (const particle of cluster) {
                            if (particle.opacity <= .002) continue;
                            const alpha = Math.min(.62, particle.opacity * (1 + particle.proximity * .55));
                            context.beginPath();
                            context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                            context.fillStyle = `rgba(225,207,228,${alpha})`;
                            context.shadowColor = "rgba(128,0,128,.35)";
                            context.shadowBlur = particle.proximity > 0 ? 5 : 2;
                            context.fill();
                        }
                    }
                    context.shadowBlur = 0;
                }

                animate(time) {
                    if (!this.visible) {
                        this.frame = 0;
                        return;
                    }
                    this.draw(time);
                    if (!this.reducedMotion) {
                        this.frame = requestAnimationFrame((nextTime) => this.animate(nextTime));
                    } else {
                        this.frame = 0;
                    }
                }
            }

            document.querySelectorAll(".constellation-canvas").forEach((canvas) => new ConstellationNetwork(canvas));
