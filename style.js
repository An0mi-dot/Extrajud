const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

const meshHtml = `
    <div class="bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
    </div>
`;
html = html.replace('<body>', '<body>\n' + meshHtml);

const cssToAdd = `
        /* ===========================
           ENHANCED UI - MESH & CARDS
           =========================== */
        .bg-shapes {
            position: absolute;
            inset: 0;
            overflow: hidden;
            z-index: -1;
            pointer-events: none;
            opacity: 0.6;
        }
        [data-theme='dark'] .bg-shapes { opacity: 0.15; }

        .shape {
            position: absolute;
            filter: blur(80px);
            border-radius: 50%;
            animation: moveGradient 15s infinite alternate ease-in-out;
        }
        .shape-1 {
            width: 400px; height: 400px;
            background: rgba(16, 185, 129, 0.3);
            margin-top: -100px; margin-left: -100px;
        }
        .shape-2 {
            width: 500px; height: 500px;
            background: rgba(52, 211, 153, 0.2);
            bottom: -200px; right: -100px;
            animation-delay: -5s;
        }
        .shape-3 {
            width: 300px; height: 300px;
            background: rgba(6, 95, 70, 0.2);
            margin-top: 40%; margin-left: 50%; transform: translate(-50%, -50%);
            animation-delay: -10s;
        }
        @keyframes moveGradient {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(40px, 40px) scale(1.1); }
        }

        .hub-card {
            background: rgba(255, 255, 255, 0.6) !important;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05) !important;
        }
        [data-theme='dark'] .hub-card {
            background: rgba(30, 41, 59, 0.6) !important;
            border: 1px solid rgba(255, 255, 255, 0.05) !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
        }
        .hub-card:hover {
            transform: translateY(-8px) scale(1.02) !important;
            box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15) !important;
            border-color: rgba(16, 185, 129, 0.4) !important;
            background: rgba(255, 255, 255, 0.8) !important;
        }
        [data-theme='dark'] .hub-card:hover {
            background: rgba(30, 41, 59, 0.9) !important;
        }

        .brand-main {
            text-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
        }
`;

html = html.replace('</style>', cssToAdd + '\n    </style>');
fs.writeFileSync('public/index.html', html, 'utf8');
console.log('UI updated');
