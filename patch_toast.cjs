const fs = require('fs');
let code = fs.readFileSync('src/components/ToastNotification.tsx', 'utf8');

code = code.replace(
  '<span className="leading-snug">{geoToast.message}</span>',
  '<span className="leading-snug whitespace-pre-line">{geoToast.message}</span>'
);

fs.writeFileSync('src/components/ToastNotification.tsx', code);
