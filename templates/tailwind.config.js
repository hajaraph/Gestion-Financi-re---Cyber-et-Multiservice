    // tailwind.config.js
    /** @type {import('tailwindcss').Config} */
    // eslint-disable-next-line no-undef
    module.exports = {
      darkMode: ["class"],
      content: [
        "./index.html", // Assurez-vous que le fichier HTML principal est scanné
        "./src/**/*.{js,jsx,ts,tsx}", // Scanne tous les fichiers JS, JSX, TS, TSX dans le dossier src
        "./src/**/**/*.{js,jsx,ts,tsx}", // Pour les fichiers plus profonds dans src
        "./src/components/**/*.{js,jsx,ts,tsx}", // Spécifique pour les composants
        "./src/components/**/**/*.{js,jsx,ts,tsx}", // Spécifique pour les sous-dossiers de composants
        "./src/pages/**/*.{js,jsx,ts,tsx}", // Spécifique pour les pages
        "./src/pages/**/**/*.{js,jsx,ts,tsx}", // Spécifique pour les sous-dossiers de pages
        "./src/context/**/*.{js,jsx,ts,tsx}", // Spécifique pour les contextes
        "./src/hooks/**/*.{js,jsx,ts,tsx}", // Spécifique pour les hooks
        "./src/services/**/*.{js,jsx,ts,tsx}", // Spécifique pour les services
        // Ajoutez d'autres chemins si vous avez des fichiers Tailwind en dehors de src/
      ],
      theme: {
        container: {
          center: true,
          padding: "2rem",
          screens: {
            "2xl": "1400px",
          },
        },
        extend: {
          colors: {
            border: 'hsl(var(--border))',
            input: 'hsl(var(--input))',
            ring: 'hsl(var(--ring))',
            background: 'hsl(var(--background))',
            foreground: 'hsl(var(--foreground))',
            primary: {
              DEFAULT: 'hsl(var(--primary))',
              foreground: 'hsl(var(--primary-foreground))',
            },
            secondary: {
              DEFAULT: 'hsl(var(--secondary))',
              foreground: 'hsl(var(--secondary-foreground))',
            },
            destructive: {
              DEFAULT: 'hsl(var(--destructive))',
              foreground: 'hsl(var(--destructive-foreground))',
            },
            muted: {
              DEFAULT: 'hsl(var(--muted))',
              foreground: 'hsl(var(--muted-foreground))',
            },
            accent: {
              DEFAULT: 'hsl(var(--accent))',
              foreground: 'hsl(var(--accent-foreground))',
            },
            popover: {
              DEFAULT: 'hsl(var(--popover))',
              foreground: 'hsl(var(--popover-foreground))',
            },
            card: {
              DEFAULT: 'hsl(var(--card))',
              foreground: 'hsl(var(--card-foreground))',
            },
          },
          borderRadius: {
            lg: 'var(--radius)',
            md: 'calc(var(--radius) - 2px)',
            sm: 'calc(var(--radius) - 4px)',
          },
          keyframes: {
            'accordion-down': {
              from: { height: 0 },
              to: { height: 'var(--radix-accordion-content-height)' },
            },
            'accordion-up': {
              from: { height: 'var(--radix-accordion-content-height)' },
              to: { height: 0 },
            },
          },
          animation: {
            'accordion-down': 'accordion-down 0.2s ease-out',
            'accordion-up': 'accordion-up 0.2s ease-out',
          },
          // Vous n'avez pas besoin de définir les keyframes et animations ici
          // si tailwindcss-animate est correctement configuré, il le fait pour vous.
          // Mais si vous les avez déjà, assurez-vous qu'ils sont corrects.
        },
      },
        // eslint-disable-next-line no-undef
      plugins: [require('tailwindcss-animate')], // <--- Cette ligne est essentielle !
    };
