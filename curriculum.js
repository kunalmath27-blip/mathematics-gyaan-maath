/* Teaching examples are curated starter lessons; the chapter library is an index. */
window.Curriculum = {
  chapters: {
    '9': [
      'Number Systems', 'Polynomials', 'Coordinate Geometry',
      'Linear Equations in Two Variables', 'Euclid’s Geometry', 'Lines & Angles',
      'Triangles', 'Quadrilaterals', 'Circles', 'Heron’s Formula',
      'Surface Areas & Volumes', 'Statistics'
    ],
    '10': [
      'Real Numbers', 'Polynomials', 'Pair of Linear Equations',
      'Quadratic Equations', 'Arithmetic Progressions', 'Triangles',
      'Coordinate Geometry', 'Trigonometry', 'Applications of Trigonometry',
      'Circles', 'Areas Related to Circles', 'Surface Areas & Volumes',
      'Statistics', 'Probability'
    ],
    '11': [
      'Sets', 'Relations & Functions', 'Trigonometric Functions',
      'Complex Numbers & Quadratics', 'Linear Inequalities',
      'Permutations & Combinations', 'Binomial Theorem', 'Sequences & Series',
      'Straight Lines', 'Conic Sections', 'Introduction to 3D Geometry',
      'Limits & Derivatives', 'Statistics', 'Probability'
    ],
    '12': [
      'Relations & Functions', 'Inverse Trigonometric Functions', 'Matrices',
      'Determinants', 'Continuity & Differentiability', 'Applications of Derivatives',
      'Integrals', 'Applications of Integrals', 'Differential Equations',
      'Vector Algebra', '3D Geometry', 'Linear Programming', 'Probability'
    ],
    'JEE': [
      'Algebra', 'Trigonometry', 'Coordinate Geometry', 'Differential Calculus',
      'Integral Calculus', 'Vectors & 3D', 'Probability & Combinatorics'
    ]
  },
  lessons: [
    {
      id: 'heron', classLevel: '9', chapter: 'Heron’s Formula',
      title: 'Area from three sides', subtitle: 'Heron’s formula · Worked example',
      formula: 's = (a + b + c) / 2;  A = √[s(s − a)(s − b)(s − c)]',
      question: 'A triangle has sides 13 cm, 14 cm and 15 cm. Find its area and the height on the 14 cm base.',
      steps: [
        'Find the semiperimeter: s = (13 + 14 + 15) / 2 = 21 cm.',
        'Substitute into Heron’s formula: A = √[21 × (21 − 13) × (21 − 14) × (21 − 15)].',
        'Simplify: A = √(21 × 8 × 7 × 6) = √7056 = 84 cm².',
        'Use A = ½ × base × height: height = 2 × 84 / 14 = 12 cm.'
      ],
      answer: 'Area = 84 cm²; height on the 14 cm base = 12 cm.',
      hinglish: 'Pehle aadha perimeter nikalo. Phir Heron formula mein teenon sides ki values rakho. Height ke liye area = ½ × base × height use karo.',
      diagram: 'triangle',
      practice: {
        question: 'Find the area of a triangle with sides 5 cm, 12 cm and 13 cm.',
        answer: '30 cm²', hint: 's = 15 cm; calculate √(15 × 10 × 3 × 2).'
      },
      commonMistake: 's is the semiperimeter, half the perimeter. Area is measured in square units.'
    },
    {
      id: 'pythagoras', classLevel: '9', chapter: 'Triangles',
      title: 'The missing side', subtitle: 'Pythagoras · Right-triangle exploration',
      formula: 'a² + b² = c²  (c is the hypotenuse)',
      question: 'A right triangle has perpendicular sides 9 cm and 12 cm. Find the hypotenuse.',
      steps: [
        'Identify the hypotenuse: it is opposite the 90° angle and is the longest side.',
        'Write c² = 9² + 12².',
        'Calculate c² = 81 + 144 = 225.',
        'A length is positive, so c = √225 = 15 cm.',
        'Check: 9² + 12² = 15², so the three lengths satisfy the theorem.'
      ],
      answer: 'The hypotenuse is 15 cm.',
      hinglish: 'Sirf right triangle mein do perpendicular sides ke squares add karke hypotenuse ka square milta hai. Aakhir mein square root lena zaroori hai.',
      diagram: null,
      practice: {
        question: 'A right triangle has hypotenuse 13 cm and one perpendicular side 5 cm. Find the other side.',
        answer: '12 cm', hint: 'The unknown side squared is 13² − 5² = 144.'
      },
      commonMistake: 'Do not add the side lengths directly. The hypotenuse must be the side opposite the right angle.'
    },
    {
      id: 'quadratic', classLevel: '10', chapter: 'Quadratic Equations',
      title: 'Where the curve meets zero', subtitle: 'Quadratic equations · Factorise and visualise',
      formula: 'x = [−b ± √(b² − 4ac)] / (2a),  a ≠ 0',
      question: 'Solve x² − 5x + 6 = 0 and connect the roots to its graph.',
      steps: [
        'Look for two numbers whose sum is −5 and whose product is 6: −2 and −3.',
        'Factorise: x² − 5x + 6 = (x − 2)(x − 3).',
        'A product is zero when at least one factor is zero: x − 2 = 0 or x − 3 = 0.',
        'Therefore x = 2 or x = 3. Substitution gives 0 in both cases.',
        'The graph y = x² − 5x + 6 crosses the x-axis at (2, 0) and (3, 0). Its vertex is (2.5, −0.25).'
      ],
      answer: 'x = 2 or x = 3.',
      hinglish: 'Do aise numbers chuno jinka product 6 aur sum −5 ho. Graph jahan x-axis ko cut karta hai, wahi equation ke real roots hain.',
      diagram: 'parabola',
      practice: {
        question: 'Solve x² − 7x + 12 = 0.',
        answer: 'x = 3 or x = 4', hint: 'Find two numbers with product 12 and sum −7.'
      },
      commonMistake: 'Check both the sum and the product when choosing factors. The factors x − 2 and x − 3 give positive roots 2 and 3.'
    },
    {
      id: 'arithmetic-progression', classLevel: '10', chapter: 'Arithmetic Progressions',
      title: 'Find a term, add a series', subtitle: 'Arithmetic progressions · Pattern to formula',
      formula: 'aₙ = a + (n − 1)d;  Sₙ = n(a + aₙ) / 2',
      question: 'For the AP 5, 8, 11, …, find the 20th term and the sum of the first 20 terms.',
      steps: [
        'The first term is a = 5 and the common difference is d = 8 − 5 = 3.',
        'There are 19 equal jumps from the first term to the 20th term.',
        'Calculate a₂₀ = 5 + (20 − 1) × 3 = 5 + 57 = 62.',
        'Use the first-and-last-term sum formula: S₂₀ = 20 × (5 + 62) / 2.',
        'Therefore S₂₀ = 10 × 67 = 670.'
      ],
      answer: '20th term = 62; sum of the first 20 terms = 670.',
      hinglish: 'Har agle term mein same difference add hota hai. Pehle se 20th term tak 19 jumps hain. Sum ke liye first aur last term ka average, terms ki sankhya se multiply karo.',
      diagram: null,
      practice: {
        question: 'For 3, 7, 11, …, find the 15th term and the sum of the first 15 terms.',
        answer: '15th term = 59; sum = 465',
        hint: 'a = 3, d = 4; a₁₅ = 3 + 14 × 4; then S₁₅ = 15(3 + 59)/2.'
      },
      commonMistake: 'The nth term uses n − 1 differences, not n. Check that the sequence really has a constant difference.'
    },
    {
      id: 'unit-circle', classLevel: '11', chapter: 'Trigonometric Functions',
      title: 'See sine and cosine', subtitle: 'Unit circle · Signs and exact values',
      formula: 'P = (cos θ, sin θ);  sin²θ + cos²θ = 1',
      question: 'Find the exact values of sin 150° and cos 150° using the unit circle.',
      steps: [
        '150° lies in quadrant II because it is between 90° and 180°.',
        'The reference angle is 180° − 150° = 30°.',
        'In quadrant II the x-coordinate is negative and the y-coordinate is positive.',
        'Use cos 30° = √3/2 and sin 30° = 1/2.',
        'Therefore P = (−√3/2, 1/2), giving cos 150° = −√3/2 and sin 150° = 1/2.'
      ],
      answer: 'sin 150° = 1/2; cos 150° = −√3/2.',
      hinglish: 'Unit circle par x-coordinate cosine hai aur y-coordinate sine. Reference angle se value aur quadrant se sign milta hai.',
      diagram: 'unitcircle',
      practice: {
        question: 'Find sin 210° and cos 210° exactly.',
        answer: 'sin 210° = −1/2; cos 210° = −√3/2',
        hint: '210° is in quadrant III, with reference angle 30°. Both coordinates are negative.'
      },
      commonMistake: 'Reference angles give magnitudes; the quadrant determines signs. Keep degree mode when calculating angles in degrees.'
    },
    {
      id: 'quadratic-inequality', classLevel: '11', chapter: 'Linear Inequalities',
      title: 'When is a quadratic non-positive?', subtitle: 'Algebra extension · Sign intervals',
      formula: '(x − 2)(x − 3) ≤ 0  ⇔  2 ≤ x ≤ 3',
      question: 'Solve x² − 5x + 6 ≤ 0 over the real numbers.',
      steps: [
        'Factorise the expression: x² − 5x + 6 = (x − 2)(x − 3).',
        'The zeros 2 and 3 split the real line into x < 2, 2 < x < 3, and x > 3.',
        'For x < 2 both factors are negative, so their product is positive.',
        'For 2 < x < 3 the factors have opposite signs, so their product is negative.',
        'For x > 3 both factors are positive. Include x = 2 and x = 3 because the inequality allows equality.'
      ],
      answer: 'x ∈ [2, 3], equivalently 2 ≤ x ≤ 3.',
      hinglish: 'Roots number line ko intervals mein baant dete hain. Har interval mein factors ke signs dekho. Product negative chahiye, isliye roots ke beech ka interval lo; equality hai toh endpoints bhi lo.',
      diagram: 'parabola',
      practice: {
        question: 'Solve x² − x − 6 > 0.',
        answer: 'x < −2 or x > 3',
        hint: 'Factorise as (x − 3)(x + 2). A product is positive when both factors have the same sign. Strict > excludes the roots.'
      },
      commonMistake: 'Do not keep only the roots: an inequality usually has intervals of solutions. This lesson extends the core linear-inequality chapter.'
    },
    {
      id: 'derivative', classLevel: '12', chapter: 'Applications of Derivatives',
      title: 'A tangent is a local slope', subtitle: 'Derivatives · From secant to tangent',
      formula: 'f′(a) = limₕ→₀ [f(a + h) − f(a)] / h;  y − f(a) = f′(a)(x − a)',
      question: 'Find the slope and equation of the tangent to y = x² at x = 2.',
      steps: [
        'At x = 2, y = 2² = 4, so the point of contact is (2, 4).',
        'The secant slope from x = 2 to x = 2 + h is [(2 + h)² − 4] / h, with h ≠ 0.',
        'Expand and simplify: (4 + 4h + h² − 4) / h = 4 + h.',
        'As h approaches 0, the slope approaches 4. Therefore f′(2) = 4.',
        'Use point-slope form: y − 4 = 4(x − 2), hence y = 4x − 4.'
      ],
      answer: 'Slope = 4; tangent equation: y = 4x − 4.',
      hinglish: 'Secant do points ko join karti hai. Doosre point ko paas laate jao toh secant ki slope tangent ki slope ban jaati hai. Isi limit ko derivative kehte hain.',
      diagram: 'derivative',
      practice: {
        question: 'Find the slope and tangent to y = x³ at x = 1.',
        answer: 'Slope = 3; tangent: y = 3x − 2',
        hint: 'f′(x) = 3x², so f′(1) = 3. The tangent passes through (1, 1).'
      },
      commonMistake: 'The derivative gives slope, not the point’s y-coordinate. Use the original function to find the point of contact.'
    },
    {
      id: 'determinant', classLevel: '12', chapter: 'Determinants',
      title: 'A 2 × 2 determinant', subtitle: 'Matrices & determinants · Order matters',
      formula: 'For A = [[a, b], [c, d]],  det(A) = ad − bc',
      question: 'Find the determinant of A = [[3, 2], [1, 4]] and decide whether A is invertible.',
      steps: [
        'Match the entries: a = 3, b = 2, c = 1, d = 4.',
        'Multiply the main diagonal entries: ad = 3 × 4 = 12.',
        'Multiply the other diagonal entries: bc = 2 × 1 = 2.',
        'Subtract in the correct order: det(A) = 12 − 2 = 10.',
        'Since det(A) ≠ 0, A is invertible. A determinant is a scalar, not another matrix.'
      ],
      answer: 'det(A) = 10; A is invertible.',
      hinglish: 'Main diagonal ka product lo aur usmein se doosri diagonal ka product subtract karo. Determinant zero na ho toh square matrix ka inverse exist karta hai.',
      diagram: null,
      practice: {
        question: 'Find det(B) for B = [[2, 5], [1, 3]]. Is B invertible?',
        answer: 'det(B) = 1; yes, B is invertible',
        hint: '2 × 3 − 5 × 1 = 6 − 5.'
      },
      commonMistake: 'Use ad − bc, not ad + bc. The order of subtraction affects the sign.'
    },
    {
      id: 'integral-symmetry', classLevel: 'JEE', chapter: 'Integral Calculus',
      title: 'One integral, two viewpoints', subtitle: 'JEE · Definite-integral symmetry',
      formula: '∫ₐᵇ f(x) dx = ∫ₐᵇ f(a + b − x) dx',
      question: 'Evaluate I = ∫₀^(π/2) sin x / (sin x + cos x) dx.',
      steps: [
        'On [0, π/2], sin x + cos x is positive, so the integrand is defined throughout the interval.',
        'Use the substitution x = π/2 − t. Reversing the bounds gives I = ∫₀^(π/2) cos t / (cos t + sin t) dt.',
        'The integration variable is a placeholder, so rewrite the second form using x.',
        'Add the two forms: 2I = ∫₀^(π/2) (sin x + cos x) / (sin x + cos x) dx.',
        'Thus 2I = ∫₀^(π/2) 1 dx = π/2, giving I = π/4.'
      ],
      answer: 'I = π/4.',
      hinglish: 'Interval ko reverse karne par sin aur cos swap ho jaate hain. Original aur reversed forms add karo: integrand 1 ban jaata hai, aur calculation seedhi ho jaati hai.',
      diagram: 'integral',
      practice: {
        question: 'Evaluate ∫₀¹ x² / [x² + (1 − x)²] dx.',
        answer: '1/2',
        hint: 'Replace x by 1 − x, then add the two versions. Their integrands sum to 1.'
      },
      commonMistake: 'When substituting, change both the differential and the limits. The symmetry formula applies to definite integrals with the stated bounds.'
    },
    {
      id: 'binomial-coefficient', classLevel: 'JEE', chapter: 'Algebra',
      title: 'Pick the coefficient directly', subtitle: 'JEE foundations · Binomial theorem',
      formula: 'Tᵣ₊₁ = ⁿCᵣ aⁿ⁻ʳ bʳ;  ⁿCᵣ = n! / [r!(n − r)!]',
      question: 'Find the coefficient of x³ in the expansion of (2 + x)⁵.',
      steps: [
        'For (a + b)ⁿ, the general term is Tᵣ₊₁ = ⁿCᵣ aⁿ⁻ʳ bʳ.',
        'Here a = 2, b = x, n = 5, so Tᵣ₊₁ = ⁵Cᵣ 2⁵⁻ʳ xʳ.',
        'To get x³, choose r = 3. This is the fourth term, T₄.',
        'Calculate ⁵C₃ = 5! / (3!2!) = 10 and 2⁵⁻³ = 2² = 4.',
        'The term is 10 × 4 × x³ = 40x³. Its coefficient is 40.'
      ],
      answer: 'The coefficient of x³ is 40.',
      hinglish: 'Poora expansion likhne ki zaroorat nahi. General term mein x ki required power match karo, phir bachi hui numerical values multiply karo.',
      diagram: null,
      practice: {
        question: 'Find the coefficient of x² in (1 + 2x)⁴.',
        answer: '24',
        hint: 'Choose r = 2: ⁴C₂ × 1² × (2x)² = 6 × 4x².'
      },
      commonMistake: 'The coefficient of xʳ includes the numeric factor inside bʳ. Also, r = 3 means the fourth term, not the third.'
    }
  ]
};
