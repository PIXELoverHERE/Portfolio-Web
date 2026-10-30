/**
 * Chevalier Sword 3D Viewer (Three.js)
 * Implements a partially movable, interactive 3D model viewer
 * within a vertical rectangular container.
 */

(function () {
    let scene, camera, renderer, swordPivot, swordModel;
    let isInitialized = false;
    let isVisible = true;
    let animFrameId = null;

    // Movement & constraint variables
    const STATE = {
        // Base resting orientation
        basePitch: 0.05,     // Slight tilt toward camera (X)
        baseYaw: 0.35,       // Default ~20 degree turn to showcase metallic blade bevel (Y)
        baseRoll: -0.06,     // Martial vertical alignment (Z)

        // User drag offsets (clamped for "partially movable")
        dragPitch: 0,
        dragYaw: 0,

        // Hover parallax offsets
        hoverPitch: 0,
        hoverYaw: 0,
        hoverRoll: 0,

        // Current interpolated values
        currentPitch: 0.05,
        currentYaw: 0.35,
        currentRoll: -0.06,
        currentPosY: 0,

        // Interaction flags
        isDragging: false,
        pointerStartX: 0,
        pointerStartY: 0,
        lastPointerX: 0,
        lastPointerY: 0,
        hasInteracted: false
    };

    // Limits for "partially movable" behavior
    const CONSTRAINTS = {
        minPitch: -0.38,   // Max ~22° tilt down (tip toward viewer)
        maxPitch: 0.38,    // Max ~22° tilt up
        minYaw: -1.35,     // Max ~77° left turn
        maxYaw: 1.35,      // Max ~77° right turn
        damping: 0.075     // Smooth interpolation speed
    };

    function initSwordViewer() {
        const container = document.getElementById('sword-canvas-container');
        const canvas = document.getElementById('sword-canvas');
        const loadingEl = document.getElementById('sword-loading');
        const cardEl = document.getElementById('sword-card');

        if (!container || !canvas) {
            console.warn('[SwordViewer] Container or canvas not found.');
            return;
        }

        if (typeof THREE === 'undefined') {
            console.warn('[SwordViewer] Three.js not loaded yet, retrying...');
            setTimeout(initSwordViewer, 150);
            return;
        }

        if (typeof THREE.GLTFLoader === 'undefined') {
            console.warn('[SwordViewer] THREE.GLTFLoader not loaded yet, retrying...');
            setTimeout(initSwordViewer, 150);
            return;
        }

        if (isInitialized) return;
        isInitialized = true;

        // 1. Scene setup
        scene = new THREE.Scene();

        // 2. Camera setup (tuned for vertical rectangular box)
        const rect = container.getBoundingClientRect();
        const aspect = (rect.width || 340) / (rect.height || 520);
        camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
        camera.position.set(0, 0, 3.8);

        // 3. WebGL Renderer
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(rect.width || 340, rect.height || 520);
        
        if (THREE.ACESFilmicToneMapping) {
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.15;
        }
        if (THREE.sRGBEncoding) {
            renderer.outputEncoding = THREE.sRGBEncoding;
        }

        // 4. Lighting setup (optimized for metallic sword reflections)
        setupLighting();

        // 5. Pivot group for smooth transformations
        swordPivot = new THREE.Group();
        swordPivot.rotation.x = STATE.basePitch;
        swordPivot.rotation.y = STATE.baseYaw;
        swordPivot.rotation.z = STATE.baseRoll;
        scene.add(swordPivot);

        // 6. Load Chevalier Sword GLTF model
        loadSwordModel(loadingEl);

        // 7. Event listeners for partially movable interactions
        setupInteractions(cardEl, container);

        // 8. Handle container resizing smoothly
        setupResizeObserver(container);

        // 9. Visibility tracking to pause render loop when off-screen
        setupVisibilityTracking();

        // 10. Start render loop
        const clock = new THREE.Clock();
        function animate() {
            animFrameId = requestAnimationFrame(animate);

            if (!isVisible) return;

            const elapsedTime = clock.getElapsedTime();

            // Gentle organic idle motion (floating bob & breathing sway)
            const idleY = Math.sin(elapsedTime * 1.5) * 0.04;
            const idleSway = Math.sin(elapsedTime * 0.8) * 0.025;

            // Target orientations combining base + user drag + hover parallax + idle
            const targetPitch = STATE.basePitch + STATE.dragPitch + STATE.hoverPitch;
            const targetYaw = STATE.baseYaw + STATE.dragYaw + STATE.hoverYaw + idleSway;
            const targetRoll = STATE.baseRoll + STATE.hoverRoll;
            const targetY = idleY;

            // Smooth damping interpolation (Lerp)
            STATE.currentPitch += (targetPitch - STATE.currentPitch) * CONSTRAINTS.damping;
            STATE.currentYaw += (targetYaw - STATE.currentYaw) * CONSTRAINTS.damping;
            STATE.currentRoll += (targetRoll - STATE.currentRoll) * CONSTRAINTS.damping;
            STATE.currentPosY += (targetY - STATE.currentPosY) * CONSTRAINTS.damping;

            // Apply to sword pivot
            swordPivot.rotation.x = STATE.currentPitch;
            swordPivot.rotation.y = STATE.currentYaw;
            swordPivot.rotation.z = STATE.currentRoll;
            swordPivot.position.y = STATE.currentPosY;

            renderer.render(scene, camera);
        }

        animate();
    }

    function setupLighting() {
        // Base ambient light for soft fill
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        scene.add(ambientLight);

        // Key light (strong bright directional light from top right for specular blade highlights)
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
        keyLight.position.set(2.5, 3.5, 3.0);
        scene.add(keyLight);

        // Fill light (cool tone from left to highlight blade edges)
        const fillLight = new THREE.DirectionalLight(0xcde1ff, 1.4);
        fillLight.position.set(-2.5, 1.2, 2.0);
        scene.add(fillLight);

        // Rim light (back light for silhouette separation against dark background)
        const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
        rimLight.position.set(0, 2.0, -3.2);
        scene.add(rimLight);

        // Hilt & Guard accent point light
        const guardLight = new THREE.PointLight(0xffeedd, 1.0, 6);
        guardLight.position.set(0, -0.6, 1.6);
        scene.add(guardLight);
    }

    function loadSwordModel(loadingEl) {
        const loader = new THREE.GLTFLoader();
        const modelPath = 'media/Model/chevalier_sword/scene.gltf';

        loader.load(
            modelPath,
            (gltf) => {
                swordModel = gltf.scene;

                // Center model pivot based on bounding box
                const box = new THREE.Box3().setFromObject(swordModel);
                const center = box.getCenter(new THREE.Vector3());
                swordModel.position.x = -center.x;
                swordModel.position.y = -center.y;
                swordModel.position.z = -center.z;

                // The raw model has sword along Z-axis (Z = +1.0 tip, Z = -0.98 pommel)
                // Rotate around X by -90° (-Math.PI / 2) to orient sword vertically (tip pointing UP)
                swordModel.rotation.x = -Math.PI / 2;

                // Enhance materials for metallic reflections
                swordModel.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.material.side = THREE.DoubleSide;
                        if (child.material.isMeshStandardMaterial) {
                            child.material.metalness = Math.max(child.material.metalness || 0, 0.85);
                            child.material.roughness = Math.min(child.material.roughness || 1, 0.38);
                            child.material.envMapIntensity = 1.2;
                            child.material.needsUpdate = true;
                        }
                    }
                });

                swordPivot.add(swordModel);

                // Smoothly fade out the loading overlay
                if (loadingEl) {
                    loadingEl.style.opacity = '0';
                    setTimeout(() => {
                        loadingEl.style.display = 'none';
                    }, 500);
                }
            },
            (xhr) => {
                // Optional loading progress
            },
            (error) => {
                console.error('[SwordViewer] Error loading 3D sword model:', error);
                if (loadingEl) {
                    loadingEl.innerHTML = `
                        <div class="p-4 text-center">
                            <span class="material-symbols-outlined text-amber-400 text-2xl mb-1">warning</span>
                            <p class="font-code-sm text-xs text-on-surface-variant">Model preview requires a local web server (e.g. Live Server or 'python3 -m http.server') to allow glTF textures.</p>
                        </div>
                    `;
                }
            }
        );
    }

    function setupInteractions(cardEl, container) {
        const hintEl = document.getElementById('sword-hint');
        const resetBtn = document.getElementById('sword-reset-btn');

        // Reset view handler
        function resetView() {
            STATE.dragPitch = 0;
            STATE.dragYaw = 0;
            STATE.hoverPitch = 0;
            STATE.hoverYaw = 0;
            STATE.hoverRoll = 0;
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                resetView();
            });
        }

        // Pointer down -> Start dragging
        cardEl.addEventListener('pointerdown', (e) => {
            STATE.isDragging = true;
            STATE.pointerStartX = e.clientX;
            STATE.pointerStartY = e.clientY;
            STATE.lastPointerX = e.clientX;
            STATE.lastPointerY = e.clientY;

            container.classList.remove('cursor-grab');
            container.classList.add('cursor-grabbing');

            // Hide instruction hint after first interaction
            if (!STATE.hasInteracted && hintEl) {
                STATE.hasInteracted = true;
                hintEl.style.opacity = '0';
            }

            try {
                cardEl.setPointerCapture(e.pointerId);
            } catch (err) {}
        });

        // Pointer move -> Handle drag or hover parallax
        cardEl.addEventListener('pointermove', (e) => {
            const rect = cardEl.getBoundingClientRect();

            if (STATE.isDragging) {
                const deltaX = e.clientX - STATE.lastPointerX;
                const deltaY = e.clientY - STATE.lastPointerY;

                STATE.lastPointerX = e.clientX;
                STATE.lastPointerY = e.clientY;

                // Partially movable: constrained delta updates
                STATE.dragYaw += deltaX * 0.009;
                STATE.dragPitch += deltaY * 0.006;

                // Clamp within bounds
                STATE.dragPitch = Math.max(CONSTRAINTS.minPitch, Math.min(CONSTRAINTS.maxPitch, STATE.dragPitch));
                STATE.dragYaw = Math.max(CONSTRAINTS.minYaw, Math.min(CONSTRAINTS.maxYaw, STATE.dragYaw));
            } else {
                // Hover parallax tilt when cursor moves across the vertical rectangle
                const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;

                STATE.hoverYaw = nx * 0.35;        // Partially leans horizontally
                STATE.hoverPitch = -ny * 0.22;     // Partially leans vertically
                STATE.hoverRoll = -nx * 0.08;      // Subtle roll
            }
        });

        // Pointer up / cancel -> End dragging
        function endDrag(e) {
            if (STATE.isDragging) {
                STATE.isDragging = false;
                container.classList.remove('cursor-grabbing');
                container.classList.add('cursor-grab');
                try {
                    cardEl.releasePointerCapture(e.pointerId);
                } catch (err) {}
            }
        }

        cardEl.addEventListener('pointerup', endDrag);
        cardEl.addEventListener('pointercancel', endDrag);

        // Pointer leave -> reset hover parallax smoothly
        cardEl.addEventListener('pointerleave', () => {
            if (!STATE.isDragging) {
                STATE.hoverPitch = 0;
                STATE.hoverYaw = 0;
                STATE.hoverRoll = 0;
            }
        });

        // Double click resets view
        cardEl.addEventListener('dblclick', resetView);
    }

    function setupResizeObserver(container) {
        const resize = () => {
            if (!container || !renderer || !camera) return;
            const rect = container.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            if (width === 0 || height === 0) return;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => resize());
            ro.observe(container);
        } else {
            window.addEventListener('resize', resize);
        }
    }

    function setupVisibilityTracking() {
        const homeSection = document.getElementById('page-home');
        const cardEl = document.getElementById('sword-card');

        // Check if Home section is active in SPA navigation
        const updateVisibility = () => {
            const isHomeActive = homeSection ? homeSection.classList.contains('active') : true;
            isVisible = isHomeActive;
            if (isVisible && renderer && camera) {
                const container = document.getElementById('sword-canvas-container');
                if (container) {
                    const rect = container.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        camera.aspect = rect.width / rect.height;
                        camera.updateProjectionMatrix();
                        renderer.setSize(rect.width, rect.height);
                    }
                }
            }
        };

        if (homeSection && window.MutationObserver) {
            const observer = new MutationObserver(() => updateVisibility());
            observer.observe(homeSection, { attributes: true, attributeFilter: ['class', 'style'] });
        }

        window.addEventListener('page-switched', (e) => {
            if (e.detail && e.detail.pageId === 'home') {
                setTimeout(updateVisibility, 60);
            } else {
                isVisible = false;
            }
        });

        // IntersectionObserver to pause rendering when scrolled out of view
        if (cardEl && window.IntersectionObserver) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        isVisible = homeSection ? homeSection.classList.contains('active') : true;
                    } else {
                        isVisible = false;
                    }
                });
            }, { threshold: 0.05 });
            io.observe(cardEl);
        }
    }

    // Expose init function globally & auto-initialize on DOM ready
    window.initSwordViewer = initSwordViewer;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSwordViewer);
    } else {
        initSwordViewer();
    }
})();
