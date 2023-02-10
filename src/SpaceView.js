import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function SpaceView() {

    let clock = new THREE.Clock();
    let canvas = document.querySelector('canvas.webgl');
    let scene = new THREE.Scene();

    let camera = new THREE.PerspectiveCamera(750, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.layers.enable(0);
    camera.layers.enable(1);
    camera.position.z = 2.1;
    camera.position.x = -0.5;
    camera.position.y = 0.5;

    let renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;

    let ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight);

    let spotLight = addSpotlight();
    scene.add(spotLight);

    let textureLoader = new THREE.TextureLoader();

    let earth = addEarth();
    scene.add(earth);

    // // Clouds
    // const cloudTexture = textureLoader.load('/earthcloudmap.jpg');
    // const cloudGeometry = new THREE.SphereGeometry(1.02, 40, 40);
    // const cloudMaterial = new THREE.MeshPhongMaterial({
    //   map: cloudTexture,
    //   transparent: true,
    //   alphaMap: textureLoader.load('/earthcloudmaptrans.jpg'),
    //   opacity: 0.4,
    //   // depthWrite: false,
    // });
    // const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    // clouds.layers.set(1);
    // // scene.add(clouds);

    let bloomPass = addBloomEffect();
    let outlinePass = addAtmosphereEffect();

    let composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(bloomPass);
    composer.addPass(outlinePass);

    let light = addSun();
    scene.add(light);

    let {stars1, stars2} = createStarBackground();
    scene.add(stars1);
    scene.add(stars2);

    let mouseX;
    let mouseY;
    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Moon Plane
    let moon = addMoon();
    scene.add(moon);

    // Astronaut
    let mixer;
    let astronautModel;
    const loader = new GLTFLoader();
    loader.load(
      'astronaut.glb',
      function (glb) {
        astronautModel = glb.scene;

        astronautModel.traverse((object) => {
          object.layers.set(1);
        });

        // on moon
        astronautModel.castShadow = true;
        astronautModel.scale.set(0.2, 0.2, 0.2);
        astronautModel.position.set(-13, -0.15, 0.8);
        astronautModel.rotation.set(0, Math.PI/3, 0);

        mixer = new THREE.AnimationMixer(astronautModel);

        const action = mixer.clipAction(glb.animations[0]); // float
        action.play();

        scene.add(astronautModel);

        gsap.to(astronautModel.rotation, {
          y: 2,
          duration: 40,
          delay: 3,
          repeat: -1,
          yoyo: true,
        });

        gsap.to(astronautModel.position, {
          x: -13.2,
          z: 0.5,
          repeat: -1,
          yoyo: true,
          duration: 20,
          ease: "sine.inOut",
        })
  
      },
      // called while loading is progressing
      function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      // called when loading has errors
      function (error) {
        console.log('An error happened', error);
      }
    )

    // Animation GSAP
    gsap.registerPlugin(ScrollTrigger);
    setupScrollAnimation();

    animate();



  // ****** FUNCTIONS FOR RENDERING ****** //
  function setupScrollAnimation() {
    const sections = document.querySelectorAll('.section')
    const t1 = gsap.timeline();

    t1
      .to( camera.position, {
        x: -1, y: -1, z: 10,
        scrollTrigger: {
          trigger: sections[1],
          scrub: true,
          immediateRender: false,
        }
      })
      
      .to( camera.position, {
        x: -20, y: 1, z: 0,
        scrollTrigger: {
          trigger: sections[3],
          scrub: true,
          immediateRender: false,
        }
      })
      .to( camera.rotation, {
        y: -90 * Math.PI / 180,
        scrollTrigger: {
          trigger: sections[3],
          scrub: true,
          immediateRender: false,
        }
      })
  }
  
  function addMoon() {
    const moonGeo = new THREE.PlaneGeometry(10, 10, 1, 1);
    const moonMat = new THREE.MeshBasicMaterial({map:  textureLoader.load('/2k_moon.jpg')});
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(-17, -0.15, 2.3);
    moon.rotation.set(-Math.PI/2, 0, 0);
    moon.receiveShadow = true;
    moon.material.side = THREE.DoubleSide;
    moon.layers.set(1);
    return moon;
  }

  function createStarBackground() {
    const getRandomParticelPos = (particleCount) => {
      const arr = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        arr[i] = (Math.random() - 0.5) * 10;
      }
      return arr;
    };
  
    const geometries = [
      new THREE.BufferGeometry(),
      new THREE.BufferGeometry()
    ];
    geometries[0].setAttribute(
      "position",
      new THREE.BufferAttribute(getRandomParticelPos(350), 3)
    );
    geometries[1].setAttribute(
      "position",
      new THREE.BufferAttribute(getRandomParticelPos(1500), 3)
    );
  
    let starMaterials = [
      new THREE.PointsMaterial({
        size: 0.05,
        map:  textureLoader.load("https://raw.githubusercontent.com/Kuntal-Das/textures/main/sp1.png"),
        transparent: true,
      }),
      new THREE.PointsMaterial({
        size: 0.075,
        map:  textureLoader.load("https://raw.githubusercontent.com/Kuntal-Das/textures/main/sp2.png"),
        transparent: true,
      })
    ];
  
    const stars1 = new THREE.Points(geometries[0], starMaterials[0]);
    const stars2 = new THREE.Points(geometries[1], starMaterials[1]);

    return {stars1, stars2};
  }

  function addSun() {
    const light = new THREE.PointLight(0x404040, 0.5, 200);
    const textureFlare0 =  textureLoader.load("/lensflare0.png");
    const textureFlare1 =  textureLoader.load("/lensflare2.png");
    const textureFlare2 =  textureLoader.load("/lensflare3.png");
  
    let lensflare = new Lensflare();
    lensflare.addElement(new LensflareElement(textureFlare0, 150, 0));
    lensflare.addElement(new LensflareElement(textureFlare1, 350, 0));
    lensflare.addElement(new LensflareElement(textureFlare2, 25, 0.6));
    light.add(lensflare);
    light.position.set(-1, 5, -100)
    return light;
  }

  function addAtmosphereEffect() {
    let outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight),  scene,  camera, [ earth]);
    // outlinePass.pulsePeriod = 30;
    outlinePass.edgeStrength = 5;
    outlinePass.edgeGlow = 1;
    outlinePass.edgeThickness = 10;
    outlinePass.visibleEdgeColor.set(0x6981E7);
    outlinePass.hiddenEdgeColor.set(0xff0000);
    return outlinePass;
  }

  function addBloomEffect() {
    let bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.2;
    bloomPass.strength = 1.5;
    bloomPass.radius = 0;
    return bloomPass;
  }

  function addEarth() {
    const geometry = new THREE.SphereGeometry(1, 40, 40);
    const material = new THREE.MeshPhongMaterial();
    material.map =  textureLoader.load('/earth_nightmap.jpeg');
    material.bumpMap =  textureLoader.load('/earthbump1k.jpg');
    material.bumpScale = 0.035;
    material.shininess = 0.3;
    const earth = new THREE.Mesh(geometry, material);
    earth.rotation.y += 2;
    earth.layers.enable(0);
    return earth;
  }

  function addSpotlight() {
    let spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(-20, 0, 0);
    spotLight.intensity = 3;
    spotLight.distance = 200;
    spotLight.angle = 1.04;
    spotLight.castShadow = true;
    spotLight.layers.enable(0);
    spotLight.layers.enable(1);
    return spotLight;
  }

  function animate() {
    requestAnimationFrame( animate.bind(this));

    earth.rotation.y += 0.001;

    stars1.position.x =  mouseX * 0.0001;
    stars1.position.y =  mouseY * -0.0001;
    stars2.position.x =  mouseX * 0.0001;
    stars2.position.y =  mouseY * -0.0001;

    // clouds.rotation.y -= 0.001;

    // astronuat animation
    if ( mixer)  mixer.update( clock.getDelta());

    // to selectively render layers so some objects bloom and others don't
    renderer.clear();
    camera.layers.set(0);
    composer.render();

    renderer.clearDepth();
    camera.layers.set(1);
    renderer.render( scene,  camera);
  };
}

export default SpaceView;