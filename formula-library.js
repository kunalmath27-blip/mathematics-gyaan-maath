(function (root) {
  'use strict';

  // A curated, offline reference collection; this is not a complete syllabus.
  const entries = [
    {id:'9-square-sum',level:'9',topic:'Algebraic identities',title:'Square of a sum',formula:'(a + b)² = a² + 2ab + b²',conditions:'For all real a and b.',example:'(x + 3)² = x² + 6x + 9.'},
    {id:'9-square-difference',level:'9',topic:'Algebraic identities',title:'Square of a difference',formula:'(a − b)² = a² − 2ab + b²',conditions:'For all real a and b.',example:'(x − 2)² = x² − 4x + 4.'},
    {id:'9-difference-squares',level:'9',topic:'Algebraic identities',title:'Difference of squares',formula:'a² − b² = (a − b)(a + b)',conditions:'For all real a and b.',example:'25 − 9 = (5 − 3)(5 + 3) = 16.'},
    {id:'9-cube-sum',level:'9',topic:'Algebraic identities',title:'Cube of a sum',formula:'(a + b)³ = a³ + 3a²b + 3ab² + b³',conditions:'For all real a and b.',example:'(x + 1)³ = x³ + 3x² + 3x + 1.'},
    {id:'9-cube-difference',level:'9',topic:'Algebraic identities',title:'Cube of a difference',formula:'(a − b)³ = a³ − 3a²b + 3ab² − b³',conditions:'For all real a and b.',example:'(x − 1)³ = x³ − 3x² + 3x − 1.'},
    {id:'9-sum-cubes',level:'9',topic:'Algebraic identities',title:'Factor a sum of cubes',formula:'a³ + b³ = (a + b)(a² − ab + b²)',conditions:'For all real a and b.',example:'x³ + 8 = (x + 2)(x² − 2x + 4).'},
    {id:'9-difference-cubes',level:'9',topic:'Algebraic identities',title:'Factor a difference of cubes',formula:'a³ − b³ = (a − b)(a² + ab + b²)',conditions:'For all real a and b.',example:'x³ − 27 = (x − 3)(x² + 3x + 9).'},
    {id:'9-heron',level:'9',topic:'Triangles',title:'Heron’s formula',formula:'s = (a + b + c)/2;  Area = √[s(s − a)(s − b)(s − c)]',conditions:'a, b, c > 0 and each side is less than the sum of the other two.',example:'Sides 13, 14, 15 give s = 21 and area = 84 square units.'},
    {id:'9-pythagoras',level:'9',topic:'Triangles',title:'Pythagoras’ theorem',formula:'a² + b² = c²',conditions:'A right triangle; a and b are perpendicular sides and c is the hypotenuse.',example:'9² + 12² = 15².'},
    {id:'9-cylinder',level:'9',topic:'Mensuration',title:'Right circular cylinder',formula:'Volume = πr²h;  curved area = 2πrh;  total area = 2πr(h + r)',conditions:'r > 0 and h > 0; total area includes both circular ends.',example:'r = 2, h = 5: volume = 20π and total area = 28π.'},
    {id:'9-sphere',level:'9',topic:'Mensuration',title:'Sphere',formula:'Volume = 4πr³/3;  surface area = 4πr²',conditions:'r > 0; use consistent length units.',example:'r = 3: volume = 36π and surface area = 36π.'},
    {id:'9-mean',level:'9',topic:'Statistics',title:'Arithmetic mean',formula:'Mean = (x₁ + x₂ + ⋯ + xₙ)/n',conditions:'n is a positive integer; observations are real numbers.',example:'Mean of 2, 4, 9 is 15/3 = 5.'},

    {id:'10-quadratic-roots',level:'10',topic:'Quadratic equations',title:'Quadratic formula',formula:'D = b² − 4ac;  x = (−b ± √D)/(2a)',conditions:'For ax² + bx + c = 0 with real coefficients, a ≠ 0. Real roots require D ≥ 0.',example:'x² − 5x + 6 = 0 has D = 1 and roots 2, 3.'},
    {id:'10-vieta',level:'10',topic:'Quadratic equations',title:'Sum and product of roots',formula:'α + β = −b/a;  αβ = c/a',conditions:'α, β are the roots of ax² + bx + c = 0, counted with multiplicity; a ≠ 0.',example:'For x² − 5x + 6, the root sum is 5 and product is 6.'},
    {id:'10-ap-term',level:'10',topic:'Arithmetic progressions',title:'AP: nth term',formula:'aₙ = a + (n − 1)d',conditions:'n is a positive integer; a is the first term and d is the constant difference.',example:'5, 8, 11, … has a₂₀ = 5 + 19×3 = 62.'},
    {id:'10-ap-sum',level:'10',topic:'Arithmetic progressions',title:'AP: sum of n terms',formula:'Sₙ = n[2a + (n − 1)d]/2 = n(a + aₙ)/2',conditions:'n is a positive integer; the terms form an arithmetic progression.',example:'For 5, 8, 11, …, S₂₀ = 20(5 + 62)/2 = 670.'},
    {id:'10-distance',level:'10',topic:'Coordinate geometry',title:'Distance between two points',formula:'AB = √[(x₂ − x₁)² + (y₂ − y₁)²]',conditions:'A = (x₁, y₁), B = (x₂, y₂) in a Cartesian plane with equal axis units.',example:'Distance from (1, 2) to (4, 6) is 5.'},
    {id:'10-midpoint',level:'10',topic:'Coordinate geometry',title:'Midpoint',formula:'M = ((x₁ + x₂)/2, (y₁ + y₂)/2)',conditions:'A = (x₁, y₁) and B = (x₂, y₂) are finite points in the same plane.',example:'Midpoint of (2, 4) and (8, 10) is (5, 7).'},
    {id:'10-section',level:'10',topic:'Coordinate geometry',title:'Internal section formula',formula:'P = ((mx₂ + nx₁)/(m + n), (my₂ + ny₁)/(m + n))',conditions:'P divides AB internally in AP:PB = m:n, where m > 0 and n > 0.',example:'A = (0, 0), B = (6, 9), AP:PB = 2:1 gives P = (4, 6).'},
    {id:'10-trig-ratios',level:'10',topic:'Trigonometry',title:'Right-triangle ratios',formula:'sin θ = opposite/hypotenuse;  cos θ = adjacent/hypotenuse;  tan θ = opposite/adjacent',conditions:'θ is an acute angle of a right triangle; side labels are relative to θ.',example:'Opposite = 3, adjacent = 4, hypotenuse = 5: sin θ = 3/5.'},
    {id:'10-trig-identity',level:'10',topic:'Trigonometry',title:'Sine–cosine identity',formula:'sin²θ + cos²θ = 1',conditions:'For every real angle θ; use one consistent angle unit.',example:'At 30°: (1/2)² + (√3/2)² = 1.'},
    {id:'10-trig-reciprocal',level:'10',topic:'Trigonometry',title:'Tangent and cotangent identities',formula:'1 + tan²θ = sec²θ;  1 + cot²θ = cosec²θ',conditions:'First identity: cos θ ≠ 0. Second: sin θ ≠ 0. sec θ = 1/cos θ; cosec θ = 1/sin θ.',example:'At 45°, 1 + tan²45° = 2 = sec²45°.'},
    {id:'10-circle',level:'10',topic:'Circles',title:'Circle: area and circumference',formula:'Area = πr²;  circumference = 2πr',conditions:'r > 0; lengths use one unit and area uses its square.',example:'r = 5 cm: area = 25π cm², circumference = 10π cm.'},
    {id:'10-sector',level:'10',topic:'Circles',title:'Circular sector',formula:'Arc length = (θ/360)2πr;  area = (θ/360)πr²',conditions:'r > 0 and 0° ≤ θ ≤ 360°; θ is measured in degrees.',example:'r = 6, θ = 60°: arc length = 2π and area = 6π.'},
    {id:'10-tangent-radius',level:'10',topic:'Circles',title:'Radius and tangent',formula:'OT ⟂ tangent at T;  angle between them = 90°',conditions:'O is the circle centre; T is a point on the circle, and the line is tangent at T.',example:'A radius drawn to the point of contact makes a right angle with the tangent.'},
    {id:'10-weighted-mean',level:'10',topic:'Statistics',title:'Frequency-weighted mean',formula:'Mean = (Σfᵢxᵢ)/(Σfᵢ)',conditions:'fᵢ ≥ 0 and Σfᵢ > 0. If xᵢ are class midpoints, this is a grouped-data estimate.',example:'Values 2, 5 with frequencies 3, 1 have mean (3×2 + 1×5)/4 = 11/4.'},
    {id:'10-probability',level:'10',topic:'Probability',title:'Equally likely outcomes',formula:'P(A) = number of outcomes in A / total number of outcomes',conditions:'A finite, nonempty sample space; all elementary outcomes must be equally likely.',example:'A fair die gives P(even) = 3/6 = 1/2.'},
    {id:'10-probability-rules',level:'10',topic:'Probability',title:'Complement and union',formula:'P(Aᶜ) = 1 − P(A);  P(A ∪ B) = P(A) + P(B) − P(A ∩ B)',conditions:'A and B are events in the same probability space; no independence assumption is needed.',example:'If P(A) = 0.4, then P(Aᶜ) = 0.6.'},

    {id:'11-gp-term',level:'11',topic:'Sequences and series',title:'GP: nth term',formula:'aₙ = arⁿ⁻¹',conditions:'n is a positive integer; a is the first term and r ≠ 0 is the common ratio.',example:'3, 6, 12, … has a₄ = 3×2³ = 24.'},
    {id:'11-gp-sum',level:'11',topic:'Sequences and series',title:'GP: finite sum',formula:'Sₙ = a(1 − rⁿ)/(1 − r) for r ≠ 1;  Sₙ = na for r = 1',conditions:'n is a positive integer; the first term is a and the common ratio is real r.',example:'3 + 6 + 12 + 24 = 3(1 − 2⁴)/(1 − 2) = 45.'},
    {id:'11-binomial',level:'11',topic:'Binomial theorem',title:'Binomial expansion',formula:'(a + b)ⁿ = Σ[k=0 to n] ⁿCₖ aⁿ⁻ᵏbᵏ',conditions:'n is a nonnegative integer; the finite expansion is valid for real or complex a, b; zeroth powers in the expansion are 1.',example:'(1 + x)³ = 1 + 3x + 3x² + x³.'},
    {id:'11-permutation',level:'11',topic:'Combinatorics',title:'Ordered selections',formula:'ⁿPᵣ = n!/(n − r)!',conditions:'Integers n ≥ 0 and 0 ≤ r ≤ n; n distinct objects, chosen without repetition; order matters; 0! = 1.',example:'⁵P₂ = 5×4 = 20.'},
    {id:'11-combination',level:'11',topic:'Combinatorics',title:'Unordered selections',formula:'ⁿCᵣ = n!/[r!(n − r)!]',conditions:'Integers n ≥ 0 and 0 ≤ r ≤ n; n distinct objects, chosen without repetition; order does not matter; 0! = 1.',example:'⁵C₂ = 10.'},
    {id:'11-angle-sum',level:'11',topic:'Trigonometry',title:'Angle sum and difference',formula:'sin(A ± B) = sin A cos B ± cos A sin B;  cos(A ± B) = cos A cos B ∓ sin A sin B',conditions:'A and B are real angles in the same unit; choose matching upper signs or matching lower signs.',example:'cos(60° − 30°) = cos 60° cos 30° + sin 60° sin 30° = √3/2.'},
    {id:'11-double-angle',level:'11',topic:'Trigonometry',title:'Double-angle identities',formula:'sin 2θ = 2 sin θ cos θ;  cos 2θ = cos²θ − sin²θ = 1 − 2sin²θ',conditions:'For all real θ; use one consistent angle unit.',example:'sin 60° = 2 sin 30° cos 30° = √3/2.'},
    {id:'11-radians',level:'11',topic:'Trigonometry',title:'Degrees, radians and arc length',formula:'θ radians = θ° × π/180;  arc length = rθ when θ is in radians',conditions:'r > 0; use radians in s = rθ. For physical arc length use the nonnegative central angle.',example:'60° = π/3 radians; at r = 6 the arc length is 2π.'},
    {id:'11-slope',level:'11',topic:'Straight lines',title:'Slope of a line',formula:'m = (y₂ − y₁)/(x₂ − x₁)',conditions:'x₂ ≠ x₁. A vertical line has undefined slope.',example:'Through (1, 2) and (3, 8), m = 6/2 = 3.'},
    {id:'11-point-slope',level:'11',topic:'Straight lines',title:'Point–slope equation',formula:'y − y₁ = m(x − x₁)',conditions:'The line has finite slope m and passes through (x₁, y₁); vertical lines use x = x₁.',example:'Slope 2 through (1, 3): y − 3 = 2(x − 1), so y = 2x + 1.'},
    {id:'11-circle-equation',level:'11',topic:'Coordinate geometry',title:'Circle equation',formula:'(x − h)² + (y − k)² = r²',conditions:'Centre (h, k), radius r > 0; equal coordinate-axis units.',example:'Centre (2, −1), radius 3: (x − 2)² + (y + 1)² = 9.'},
    {id:'11-parabola',level:'11',topic:'Conic sections',title:'Standard right-opening parabola',formula:'y² = 4ax;  focus = (a, 0);  directrix: x = −a',conditions:'a > 0; vertex at (0, 0), axis along the positive x direction.',example:'y² = 8x has a = 2, focus (2, 0) and directrix x = −2.'},
    {id:'11-ellipse',level:'11',topic:'Conic sections',title:'Ellipse with horizontal major axis',formula:'x²/a² + y²/b² = 1;  c² = a² − b²;  foci = (±c, 0)',conditions:'a ≥ b > 0; c ≥ 0; when a = b the ellipse is a circle.',example:'x²/25 + y²/9 = 1 has a = 5, b = 3 and foci (±4, 0).'},
    {id:'11-hyperbola',level:'11',topic:'Conic sections',title:'Horizontal hyperbola',formula:'x²/a² − y²/b² = 1;  c² = a² + b²;  asymptotes: y = ±(b/a)x',conditions:'a > 0 and b > 0; centre at origin; foci (±c, 0), where c > 0.',example:'x²/9 − y²/16 = 1 has foci (±5, 0) and asymptotes y = ±4x/3.'},
    {id:'11-variance',level:'11',topic:'Statistics',title:'Population variance',formula:'μ = (Σxᵢ)/N;  σ² = Σ(xᵢ − μ)²/N;  σ = √σ²',conditions:'N is a positive integer. These are population quantities, not the sample variance with denominator N − 1.',example:'For 1, 3: μ = 2, population variance = 1 and standard deviation = 1.'},

    {id:'12-determinant',level:'12',topic:'Matrices and determinants',title:'2 × 2 determinant',formula:'If A = [[a, b], [c, d]], then det(A) = ad − bc',conditions:'A is a 2 × 2 matrix with real or complex entries.',example:'det([[3, 2], [1, 4]]) = 3×4 − 2×1 = 10.'},
    {id:'12-matrix-inverse',level:'12',topic:'Matrices and determinants',title:'Inverse of a 2 × 2 matrix',formula:'A⁻¹ = [[d, −b], [−c, a]]/(ad − bc)',conditions:'A = [[a, b], [c, d]] and ad − bc ≠ 0.',example:'[[3, 2], [1, 4]]⁻¹ = [[4, −2], [−1, 3]]/10.'},
    {id:'12-power-derivative',level:'12',topic:'Derivatives',title:'Power rule',formula:'d(xⁿ)/dx = nxⁿ⁻¹',conditions:'For real n, this formula holds on x > 0. Integer powers can have a wider domain; negative powers exclude x = 0.',example:'d(x³)/dx = 3x².'},
    {id:'12-trig-derivatives',level:'12',topic:'Derivatives',title:'Sine and cosine derivatives',formula:'d(sin x)/dx = cos x;  d(cos x)/dx = −sin x',conditions:'x is a real angle measured in radians.',example:'At x = 0, the slope of sin x is cos 0 = 1.'},
    {id:'12-exp-log-derivatives',level:'12',topic:'Derivatives',title:'Exponential and logarithmic derivatives',formula:'d(eˣ)/dx = eˣ;  d(ln x)/dx = 1/x',conditions:'Exponential formula: all real x. Natural logarithm formula: x > 0.',example:'d(ln x)/dx at x = 2 equals 1/2.'},
    {id:'12-product-rule',level:'12',topic:'Derivatives',title:'Product rule',formula:'d(uv)/dx = u′v + uv′',conditions:'u(x) and v(x) are differentiable at the point being considered.',example:'d(x² sin x)/dx = 2x sin x + x² cos x (radians).'},
    {id:'12-quotient-rule',level:'12',topic:'Derivatives',title:'Quotient rule',formula:'d(u/v)/dx = (u′v − uv′)/v²',conditions:'u and v are differentiable at the point and v ≠ 0 there.',example:'d[x/(x + 1)]/dx = 1/(x + 1)², for x ≠ −1.'},
    {id:'12-chain-rule',level:'12',topic:'Derivatives',title:'Chain rule',formula:'d[f(g(x))]/dx = f′(g(x))g′(x)',conditions:'g is differentiable at x, and f is differentiable at g(x).',example:'d[(3x + 1)²]/dx = 6(3x + 1).'},
    {id:'12-tangent',level:'12',topic:'Applications of derivatives',title:'Tangent to a graph',formula:'y − f(a) = f′(a)(x − a)',conditions:'f is differentiable at a with a finite derivative; this gives the nonvertical tangent.',example:'For f(x) = x² at a = 2: y − 4 = 4(x − 2), or y = 4x − 4.'},
    {id:'12-power-integral',level:'12',topic:'Integrals',title:'Power antiderivative',formula:'∫xⁿ dx = xⁿ⁺¹/(n + 1) + C',conditions:'n ≠ −1. For arbitrary real n use x > 0; integer powers may permit a wider domain.',example:'∫x² dx = x³/3 + C.'},
    {id:'12-log-integral',level:'12',topic:'Integrals',title:'Integral of 1/x',formula:'∫(1/x) dx = ln|x| + C',conditions:'On any interval not containing x = 0; the integration constant can differ between disconnected intervals.',example:'For x < 0, d[ln(−x)]/dx = 1/x.'},
    {id:'12-trig-integrals',level:'12',topic:'Integrals',title:'Sine and cosine antiderivatives',formula:'∫sin x dx = −cos x + C;  ∫cos x dx = sin x + C',conditions:'x is real and measured in radians; C is an arbitrary constant.',example:'∫₀^(π/2) cos x dx = 1.'},
    {id:'12-fundamental-theorem',level:'12',topic:'Definite integrals',title:'Evaluate a definite integral',formula:'∫ₐᵇ f(x) dx = F(b) − F(a), where F′ = f',conditions:'f is continuous on [a, b], a ≤ b; F is an antiderivative on that interval.',example:'∫₀² x dx = [x²/2]₀² = 2.'},
    {id:'12-dot-product',level:'12',topic:'Vectors',title:'Dot product and vector angle',formula:'a·b = a₁b₁ + a₂b₂ + a₃b₃ = |a||b| cos θ',conditions:'Real Euclidean vectors; the angle θ is defined only when both vectors are nonzero, with 0 ≤ θ ≤ π.',example:'(1, 2, 3)·(4, 0, −1) = 1.'},
    {id:'12-cross-product',level:'12',topic:'Vectors',title:'Cross-product magnitude',formula:'|a × b| = |a||b| sin θ;  parallelogram area = |a × b|',conditions:'Real 3D vectors; for nonzero vectors 0 ≤ θ ≤ π. If either vector is zero, the cross product and area are zero.',example:'Perpendicular vectors of lengths 3 and 4 give area 12.'},
    {id:'12-conditional-probability',level:'12',topic:'Probability',title:'Conditional probability',formula:'P(A|B) = P(A ∩ B)/P(B)',conditions:'A and B are events in the same probability space and P(B) > 0.',example:'For a fair die, P(even | result > 3) = 2/3.'},
    {id:'12-bayes',level:'12',topic:'Probability',title:'Bayes’ theorem',formula:'P(Aᵢ|B) = P(B|Aᵢ)P(Aᵢ) / Σⱼ[P(B|Aⱼ)P(Aⱼ)]',conditions:'A₁,…,Aₙ form a finite partition, each P(Aⱼ) > 0; P(B) > 0, so the denominator is positive.',example:'Equal-prior sources with P(B|A₁) = 0.8 and P(B|A₂) = 0.2 give P(A₁|B) = 0.8.'},

    {id:'jee-trig-limits',level:'JEE',topic:'Limits',title:'Standard trigonometric limits',formula:'lim[x→0] sin x/x = 1;  lim[x→0] (1 − cos x)/x² = 1/2',conditions:'x is measured in radians; quotients are considered for x ≠ 0 near zero.',example:'For x = 0.001 radians, sin x/x is approximately 0.999999833.'},
    {id:'jee-exp-log-limits',level:'JEE',topic:'Limits',title:'Exponential and logarithmic limits',formula:'lim[x→0] (eˣ − 1)/x = 1;  lim[x→0] ln(1 + x)/x = 1',conditions:'Real x ≠ 0 near zero; the logarithm expression also requires x > −1.',example:'For x = 0.001, ln(1 + x)/x is approximately 0.999500333.'},
    {id:'jee-infinite-gp',level:'JEE',topic:'Sequences and series',title:'Infinite geometric sum',formula:'a + ar + ar² + ⋯ = a/(1 − r)',conditions:'|r| < 1 guarantees convergence. This formula is not used for |r| ≥ 1.',example:'1 + 1/2 + 1/4 + ⋯ = 2.'},
    {id:'jee-binomial-coefficient',level:'JEE',topic:'Binomial theorem',title:'Coefficient in a linear binomial',formula:'Coefficient of xᵏ in (a + bx)ⁿ = ⁿCₖ aⁿ⁻ᵏbᵏ',conditions:'Integers n ≥ 0 and 0 ≤ k ≤ n; real or complex a, b; zeroth powers in the polynomial expansion are 1.',example:'Coefficient of x³ in (2 + x)⁵ is ⁵C₃×2² = 40.'},
    {id:'jee-integral-symmetry',level:'JEE',topic:'Definite integrals',title:'Reflection symmetry of an integral',formula:'∫ₐᵇ f(x) dx = ∫ₐᵇ f(a + b − x) dx',conditions:'Finite real a ≤ b; f is integrable on [a, b].',example:'I = ∫₀^(π/2) sin x/(sin x + cos x) dx gives 2I = π/2, so I = π/4 (radians).'},
    {id:'jee-integration-parts',level:'JEE',topic:'Integrals',title:'Integration by parts',formula:'∫u(x)v′(x) dx = u(x)v(x) − ∫v(x)u′(x) dx',conditions:'u and v are continuously differentiable on the interval; indefinite integrals include an arbitrary constant.',example:'∫x eˣ dx = x eˣ − eˣ + C.'},
    {id:'jee-scalar-triple',level:'JEE',topic:'Vectors',title:'Scalar triple product and volume',formula:'V = |a·(b × c)|;  a·(b × c) = det([[a₁,a₂,a₃],[b₁,b₂,b₃],[c₁,c₂,c₃]])',conditions:'Real 3D vectors a, b, c are adjacent edges of the parallelepiped; V = 0 for coplanar edges.',example:'Edges (2,0,0), (0,3,0), (0,0,4) give volume 24.'}
  ].map(entry => Object.freeze(entry));

  const aliases = {
    '9-heron':'semiperimeter triangle area', '9-pythagoras':'hypotenuse right angle triangle',
    '10-quadratic-roots':'roots discriminant polynomial', '10-vieta':'vieta roots polynomial',
    '10-ap-term':'ap arithmetic progression sequence nth', '10-ap-sum':'ap arithmetic progression sequence sum',
    '10-distance':'distance points coordinate geometry', '10-section':'ratio section division',
    '10-trig-reciprocal':'csc cosecant secant cotangent', '10-sector':'arc circle degrees angle',
    '11-gp-term':'gp geometric progression sequence nth', '11-gp-sum':'gp geometric progression sequence sum',
    '11-permutation':'npr arrangements factorial', '11-combination':'ncr selections factorial',
    '11-variance':'population standard deviation sigma statistics',
    '12-matrix-inverse':'inverse invertible determinant', '12-power-derivative':'differentiation derivative calculus power',
    '12-trig-derivatives':'differentiation derivative calculus sin cos radians',
    '12-exp-log-derivatives':'differentiation derivative calculus exponential logarithm natural log',
    '12-product-rule':'differentiation derivative calculus product', '12-quotient-rule':'differentiation derivative calculus quotient',
    '12-chain-rule':'differentiation derivative calculus composition', '12-power-integral':'integration antiderivative calculus power',
    '12-log-integral':'integration antiderivative logarithm natural log', '12-trig-integrals':'integration antiderivative sine cosine radians',
    '12-fundamental-theorem':'ftc integration antiderivative evaluation calculus',
    '12-dot-product':'scalar product angle perpendicular', '12-cross-product':'vector product area perpendicular',
    '12-bayes':'bayes posterior prior conditional', 'jee-infinite-gp':'gp geometric progression infinite convergence',
    'jee-scalar-triple':'scalar triple product determinant parallelepiped volume'
  };
  function normalize(value) {
    return String(value == null ? '' : value).normalize('NFKC').toLowerCase()
      .replace(/π/g,' pi ').replace(/θ/g,' theta ').replace(/σ/g,' sigma ')
      .replace(/∫/g,' integral ').replace(/[−–—]/g,'-').replace(/\^/g,'')
      .replace(/[^a-z0-9+\-]+/g,' ').trim();
  }
  const indexed = entries.map(entry => ({entry, text:normalize([entry.id, 'class ' + entry.level, entry.topic, entry.title, entry.formula, entry.conditions, entry.example || '', aliases[entry.id] || ''].join(' '))}));
  function search(query, level = 'all') {
    const requested = String(level == null ? 'all' : level).trim().toUpperCase().replace(/^CLASS\s*/, '');
    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    return indexed.filter(item => (requested === 'ALL' || item.entry.level === requested) && tokens.every(token => item.text.includes(token))).map(item => item.entry);
  }
  root.FormulaLibrary = Object.freeze({entries:Object.freeze(entries), search});
})(typeof window !== 'undefined' ? window : globalThis);
