const FluidBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Base dark */}
      <div className="absolute inset-0" style={{ backgroundColor: '#050508' }} />
      
      {/* Blob 1 — Blue */}
      <div
        className="absolute rounded-full opacity-30 mix-blend-screen"
        style={{
          width: '600px',
          height: '600px',
          top: '10%',
          left: '15%',
          background: 'radial-gradient(circle, hsl(217 91% 50%) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'blob-float-1 20s ease-in-out infinite',
        }}
      />
      
      {/* Blob 2 — Purple */}
      <div
        className="absolute rounded-full opacity-25 mix-blend-screen"
        style={{
          width: '500px',
          height: '500px',
          top: '40%',
          right: '10%',
          background: 'radial-gradient(circle, hsl(270 70% 45%) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'blob-float-2 25s ease-in-out infinite',
        }}
      />
      
      {/* Blob 3 — Green/Teal */}
      <div
        className="absolute rounded-full opacity-20 mix-blend-screen"
        style={{
          width: '450px',
          height: '450px',
          bottom: '15%',
          left: '30%',
          background: 'radial-gradient(circle, hsl(160 70% 40%) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'blob-float-3 22s ease-in-out infinite',
        }}
      />
      
      {/* Blob 4 — Cyan (subtle) */}
      <div
        className="absolute rounded-full opacity-15 mix-blend-screen"
        style={{
          width: '350px',
          height: '350px',
          top: '60%',
          left: '60%',
          background: 'radial-gradient(circle, hsl(190 80% 45%) 0%, transparent 70%)',
          filter: 'blur(100px)',
          animation: 'blob-float-4 28s ease-in-out infinite',
        }}
      />
    </div>
  );
};

export default FluidBackground;
