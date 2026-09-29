// The saved Send button's flight (assets/testassetcode/send-wide.js, approved by the owner).
// The animation code inside is unchanged; it only runs when GSAP loaded (offline or blocked,
// js/card-flow.js falls back to a plain Send button), and it exposes window.SendPlane.
if (typeof gsap !== 'undefined' && typeof MorphSVGPlugin !== 'undefined' && document.getElementById('paperPlaneRoute')) {
	// Copy of send.js with a longer flight for the wider route in send-demo.html
	MorphSVGPlugin.convertToPath("circle, rect");
	gsap.set("#paperPlaneRoute", { drawSVG: "0% 0%" });
	gsap.set("#rectSentItems", { x: "-=240" });
	const tl = gsap.timeline();

	// One driver moves the plane AND draws the trail from the same point on the route each frame,
	// so they can't drift apart. (MotionPathPlugin rotated the plane around a point off its centre,
	// swinging it up to ~70 units off the drawn path on the turns.)
	const route = document.getElementById("paperPlaneRoute");
	const plane = document.getElementById("paperPlane");
	const ROUTE_LEN = route.getTotalLength();
	const planeBox = document.getElementById("paperPlanePath").getBBox();
	const PC = { x: planeBox.x + planeBox.width / 2, y: planeBox.y + planeBox.height / 2 };   // plane centre
	const flight = { p: 0 };
	const FLIGHT = 2.6; // seconds in the air (long enough to write the message on the way back)

	// Writing: the message is laid along the plane's own flight path, and the plane spits each letter out
	// right where it is as it flies. It writes back-to-front: the "!" comes out first on the right side,
	// where the plane dives straight down (so it stands ~90° sideways), then the rest follow the curve
	// round the bottom. Letters just appear (quick fade), no flying or bouncing.
	const MESSAGE = "Thanks for sending a vibe!";
	const skyLetters = document.getElementById("skyLetters");
	let letterPlan = null, nextLetter = 0;
	function planLetters() {
		// Width of each character in the marker font
		const probe = document.createElementNS("http://www.w3.org/2000/svg", "text");
		skyLetters.appendChild(probe);
		const adv = [...MESSAGE].map((ch) => { probe.textContent = ch === " " ? "\u2002" : ch; return probe.getComputedTextLength(); });
		probe.remove();
		// Where the "!" goes: the point on the right side where the plane is heading most nearly straight down
		let startAt = 0, best = Infinity;
		for (let l = 0; l < ROUTE_LEN * 0.6; l += 4) {
			const a = route.getPointAtLength(l), b = route.getPointAtLength(l + 4);
			if (a.x < 1250) continue;
			const off = Math.abs(Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI - 90);
			if (off < best) { best = off; startAt = l; }
		}
		// Reading direction runs against the flight, so each earlier letter sits further along the route
		const plan = [];
		let at = startAt;
		for (let k = MESSAGE.length - 1; k >= 0; k--) {
			if (k < MESSAGE.length - 1) at += adv[k];
			if (MESSAGE[k] === " ") continue;
			const p = route.getPointAtLength(at), q = route.getPointAtLength(Math.max(0, at - adv[k]));
			plan.push({ ch: MESSAGE[k], at, x: p.x, y: p.y, rot: Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI });
		}
		return plan;   // in the order the plane reaches them: "!" first, "T" last
	}
	function skywrite(at) {
		if (!letterPlan) letterPlan = planLetters();
		while (nextLetter < letterPlan.length && at >= letterPlan[nextLetter].at) {
			const s = letterPlan[nextLetter++];
			const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
			t.textContent = s.ch;
			t.setAttribute("transform", "translate(" + s.x + " " + s.y + ") rotate(" + s.rot + ")");
			skyLetters.appendChild(t);
			gsap.fromTo(t, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" });
		}
	}

	const trail = { start: 0, end: 0 };
	function drawTrail() {
		route.style.strokeDasharray = Math.max(0, trail.end - trail.start) + " " + (ROUTE_LEN * 2);
		route.style.strokeDashoffset = -trail.start;
	}
	function fly() {
		const at = flight.p * ROUTE_LEN;
		const pt = route.getPointAtLength(at);
		const a = route.getPointAtLength(Math.max(0, at - 2)), b = route.getPointAtLength(Math.min(ROUTE_LEN, at + 2));
		const heading = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
		gsap.set(plane, { x: pt.x - PC.x, y: pt.y - PC.y, rotation: heading + 90 });
		trail.end = at;
		trail.start = at * 0.84;   // a short ribbon; the stardust is the real trail
		drawTrail();
		shedStardust(pt);
		skywrite(at);
	}

	// Stardust: tiny sparkles and hearts shed behind the plane; they drift, twinkle and fade
	const SPARKLE = "M0,-9 C1.2,-2.4 2.4,-1.2 9,0 C2.4,1.2 1.2,2.4 0,9 C-1.2,2.4 -2.4,1.2 -9,0 C-2.4,-1.2 -1.2,-2.4 0,-9Z";
	const HEART = "M0,7 C-9,1 -9,-6 -4.5,-7 C-2,-7.5 0,-5 0,-3.5 C0,-5 2,-7.5 4.5,-7 C9,-6 9,1 0,7Z";
	const DUST_COLOURS = ["#FF6B9D", "#FEC84A", "#C9A7FF", "#FFF6DC"];
	const dustLayer = document.getElementById("sparkles");
	let lastDust = null;
	function shedStardust(pt) {
		if (lastDust && Math.hypot(pt.x - lastDust.x, pt.y - lastDust.y) < 14) return;   // one burst every ~14 units
		lastDust = { x: pt.x, y: pt.y };
		for (let n = 0; n < 2; n++) {
			const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
			g.setAttribute("transform", "translate(" + (pt.x + gsap.utils.random(-10, 10)) + " " + (pt.y + gsap.utils.random(-10, 10)) + ")");
			const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
			p.setAttribute("d", Math.random() < 0.28 ? HEART : SPARKLE);
			p.setAttribute("fill", gsap.utils.random(DUST_COLOURS));
			g.appendChild(p); dustLayer.appendChild(g);
			const size = gsap.utils.random(0.5, 1.3);
			gsap.fromTo(p, { scale: 0, rotation: gsap.utils.random(-40, 40), opacity: 1, transformOrigin: "50% 50%" }, {
				keyframes: [
					{ scale: size, duration: 0.18, ease: "back.out(3)" },
					{ scale: size * 0.6, opacity: 0.9, duration: 0.25 },
					{ scale: 0, opacity: 0, duration: gsap.utils.random(0.6, 1.1), ease: "power1.in" }
				],
				x: gsap.utils.random(-26, 26), y: gsap.utils.random(-10, 34),   // drift, mostly downward like falling glitter
				rotation: "+=" + gsap.utils.random(-120, 120),
				onComplete: () => g.remove()
			});
		}
	}

	let ranOnce = false;

	function onBtnUp() {
		if (ranOnce) {
			tl.restart();
			return;
		}
		ranOnce = true;
		tl.to("#base", { duration: 0.2, scale: 1, transformOrigin: "50% 50%" });
		tl.to(
			"#btnBase",
			{ duration: FLIGHT - 0.2, morphSVG: "#cBottom", ease: "power1.inOut" },
			"start"
		);

		tl.to("#btnBase", { duration: 0.23, morphSVG: "#cTop", ease: "power1.inOut" });
		tl.to("#btnBase", {
			duration: 0.2,
			morphSVG: "#cCenter",
			ease: "power1.inOut"
		});
		tl.to(
			"#btnBase",
			{ duration: 0.5, morphSVG: "#cEnd", ease: "power1.inOut" },
			"revealStart"
		);
		tl.to("#rectSentItems", { x: "0", duration: 0.5 }, "revealStart");
		tl.to(
			"#mask1",
			{ x: "-=260", duration: 0.5, ease: "power1.inOut" },
			"revealStart"
		);
		tl.to(
			"#paperPlane",
			{ x: "-=205", duration: 0.5, ease: "power1.inOut" },
			"revealStart"
		);
		tl.to(
			"#paperPlanePath",
			{ duration: 0.45, morphSVG: "#tickMark" },
			"start+=" + (FLIGHT - 0.05)
		);

		tl.to(
			"#txtSend",
			{ duration: 0.6, scale: 0, transformOrigin: "50% 50%" },
			"start"
		);

		// Pivot on the plane's centre, set once (setting it every frame made GSAP compensate and drift)
		tl.fromTo(flight, { p: 0 }, { p: 1, duration: FLIGHT, ease: "sine.inOut", onStart: () => { lastDust = null; nextLetter = 0; skyLetters.replaceChildren(); gsap.set(plane, { svgOrigin: PC.x + " " + PC.y, smoothOrigin: false }); }, onUpdate: fly }, "start");

		// Touchdown: the tail catches up to the landing point and disappears
		tl.to(trail, { start: ROUTE_LEN, end: ROUTE_LEN, duration: 0.3, ease: "power1.inOut", onUpdate: drawTrail }, "start+=" + FLIGHT);

		// Touchdown: level the plane upright (whatever angle it arrived at) as it becomes the ✓
		tl.to("#paperPlane", { rotation: 0, duration: 0.4, ease: "back.out(2)" }, "start+=" + FLIGHT);

		tl.to(
			"#paperPlanePath",
			{ duration: 0.15, attr: { fill: "#FFF6DC" } },
			"start"
		);
		tl.to(
			"#paperPlanePath",
			{ duration: 0.15, attr: { fill: "#1A1625" } },
			"start+=" + (FLIGHT - 0.2)
		);
	}

	function onBtnDown() {
		gsap.timeline({ defaults: { clearProps: true } });
		gsap.to("#base", { duration: 0.1, scale: 0.9, transformOrigin: "50% 50%" });
	}

	const btn = document.getElementById("base");
	btn.addEventListener("mousedown", onBtnDown);
	btn.addEventListener("mouseup", onBtnUp);

	// Hooks for js/card-flow.js
	const PLANE_REST = plane.getAttribute('transform');
	window.SendPlane = {
		FLIGHT,
		press: onBtnDown,
		release: onBtnUp,
		// Back to a fresh "Send" button after a previous send
		reset() {
			if (!ranOnce) return;
			tl.pause(0);
			skyLetters.replaceChildren();
			trail.start = trail.end = 0;
			drawTrail();
			gsap.set(plane, { clearProps: 'transform' });
			plane.setAttribute('transform', PLANE_REST);
			dustLayer.replaceChildren();
			lastDust = null;
		}
	};
}
