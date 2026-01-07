import React, { useState, useRef } from 'react';
import './index.css';

const PROCEDURES = [
  { id: 'botox_front', label: 'Botox (Front)' },
  { id: 'botox_glabella', label: 'Botox (Glabelle)' },
  { id: 'botox_eyes', label: 'Botox (Patte d\'oie)' },
  { id: 'lips_filler', label: 'Lèvres (Acide H.)' },
  { id: 'nasolabial_filler', label: 'Sillons Nasogéniens' },
  { id: 'dark_circles', label: 'Cernes (Paupières)' },
  { id: 'cheek_volume', label: 'Volume Pommettes' },
  { id: 'jawline', label: 'Jawline & Menton' },
  { id: 'blepharoplasty', label: 'Blépharoplastie' },
  { id: 'rhinoplasty', label: 'Rhinoplastie' },
  { id: 'face_lifting', label: 'Lifting Facial' },
  { id: 'double_chin', label: 'Double Menton' },
  { id: 'otoplasty', label: 'Oreilles Décollées (Otoplastie)' },
  { id: 'breast_augmentation', label: 'Poitrine - Augmentation' },
  { id: 'breast_reduction', label: 'Poitrine - Réduction' },
  { id: 'liposuction', label: 'Lipoaspiration' },
];

// --- Sous-composants ---

const ImageUpload = ({ onImageSelect }) => {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) onImageSelect(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    if (e.target.files?.[0]) onImageSelect(e.target.files[0]);
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        border: dragActive ? '2px dashed var(--color-accent)' : '2px dashed var(--color-border)',
        background: dragActive ? 'var(--color-accent-light)' : 'var(--color-bg-panel)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
    >
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />
      <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.8 }}>📸</div>
      <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Télécharger la Photo Patient</h3>
      <p style={{ color: 'var(--color-text-secondary)', maxWidth: '280px', margin: '0 auto' }}>
        Glisser-déposer, cliquer pour parcourir, ou prendre une photo directement
      </p>
    </div>
  );
};

const ProcedureSelector = ({ selected, onToggle }) => (
  <div className="glass-panel" style={{ padding: '2rem' }}>
    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--color-accent)' }}>1. Zones d'Intervention</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.8rem' }}>
      {PROCEDURES.map((proc) => {
        const isSelected = selected.includes(proc.id);
        return (
          <button
            key={proc.id}
            onClick={() => onToggle(proc.id)}
            style={{
              padding: '1rem',
              border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: isSelected ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              background: isSelected ? 'var(--color-accent-light)' : 'white',
              transition: 'all 0.2s',
              textAlign: 'center',
              fontWeight: isSelected ? '600' : '500',
              fontSize: '0.9rem',
              boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.1)' : 'none'
            }}
          >
            {proc.label}
          </button>
        );
      })}
    </div>
  </div>
);

const DiagnosisInput = ({ value, onChange }) => (
  <div className="glass-panel" style={{ padding: '2rem' }}>
    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--color-accent)' }}>2. Diagnostic & Corrections Spécifiques</h2>
    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
      Pour chaque intervention sélectionnée, précisez le résultat souhaité (ex: Poitrine: augmenter/diminuer, Lipoaspiration: zones ciblées, Oreilles: rapprocher).
    </p>
    <textarea
      className="glass-input"
      style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
      placeholder="Décrivez les ajustements précis pour chaque intervention sélectionnée (ex: 'Poitrine: augmenter de 1 bonnet, Lipoaspiration: ventre et hanches, Rhinoplastie: affiner la pointe')."
      value={value}
      onChange={onChange}
    />
  </div>
);

const FullScreenModal = ({ src, onClose, label }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
  }} onClick={onClose}>
    <div style={{ position: 'relative', maxWidth: '95vw', maxHeight: '95vh' }}>
      <img src={src} alt="Fullscreen" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-hover)' }} />
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: -20, right: -20,
          background: 'white', borderRadius: '50%', width: 40, height: 40,
          boxShadow: 'var(--shadow-soft)', fontSize: '1.5rem', fontWeight: 'bold'
        }}
      >
        ×
      </button>
      <div style={{ textAlign: 'center', marginTop: '1rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
        {label === 'Before' ? 'Avant' : 'Après'}
      </div>
    </div>
  </div>
);


// --- Application Principale ---

function App() {
  const [step, setStep] = useState('upload');

  const [sourceImage, setSourceImage] = useState(null);
  const [sourcePreview, setSourcePreview] = useState(null);
  const [selectedProcedures, setSelectedProcedures] = useState([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [resultImage, setResultImage] = useState(null);
  const [round, setRound] = useState(0);
  const [improvementNotes, setImprovementNotes] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [fullScreenImg, setFullScreenImg] = useState(null);
  const [error, setError] = useState(null);

  const buildPrompt = ({ refinementText, roundNumber, isRefinement }) => {
    const selectedLabels = PROCEDURES
      .filter(p => selectedProcedures.includes(p.id))
      .map(p => p.label)
      .join(', ');
    const focus = selectedLabels || 'Aucune zone spécifiée';
    const details = diagnosis.trim() || 'Aucune précision fournie';
    const promptParts = [
      'Plastic surgery morphing simulation.',
      `Focus areas: ${focus}.`,
      `Details per intervention: ${details}.`,
    ];

    if (isRefinement && refinementText) {
      promptParts.push(`Refinement round ${roundNumber}: ${refinementText}. Keep previous edits and only adjust this request.`);
    }

    promptParts.push('Output: photorealistic, maintain identity, consistent lighting/background, before/after should match except requested edits.');
    return promptParts.join(' ');
  };

  const dataUrlToFile = async (dataUrl, filename) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || 'image/png' });
  };

  const runGeneration = async ({ imageFile, prompt, nextRound, resetImprovement }) => {
    if (!imageFile) return;
    setIsGenerating(true);
    setError(null);

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('image', imageFile);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/generate`, { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'La génération a échoué');

      setResultImage(data.image);
      setStep('result');
      setRound(nextRound);
      if (resetImprovement) setImprovementNotes('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageSelect = (file) => {
    setSourceImage(file);
    setSourcePreview(URL.createObjectURL(file));
    setStep('setup');
    setResultImage(null);
    setRound(0);
    setImprovementNotes('');
    setError(null);
  };

  const handleGenerate = async () => {
    if (!sourceImage) return;
    const fullPrompt = buildPrompt({ isRefinement: false });
    await runGeneration({ imageFile: sourceImage, prompt: fullPrompt, nextRound: 1, resetImprovement: true });
  };

  const handleImprove = async () => {
    if (!resultImage || !improvementNotes.trim()) return;
    const baseRound = round > 0 ? round : 1;
    const nextRound = baseRound + 1;
    const imageFile = await dataUrlToFile(resultImage, `canova-morphing-tour-${nextRound}.png`);
    const fullPrompt = buildPrompt({
      isRefinement: true,
      refinementText: improvementNotes.trim(),
      roundNumber: nextRound,
    });

    await runGeneration({ imageFile, prompt: fullPrompt, nextRound, resetImprovement: true });
  };

  const toggleProcedure = (id) => {
    setSelectedProcedures(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const handleSaveResult = async () => {
    if (!resultImage) return;
    const filename = 'canova-morphing-resultat.png';
    const shareSupported = typeof navigator !== 'undefined' && !!navigator.share;

    if (shareSupported) {
      try {
        const file = await dataUrlToFile(resultImage, filename);
        const shareData = { files: [file], title: 'Canova Morphing', text: 'Simulation de morphing' };
        if (!navigator.canShare || navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    const link = document.createElement('a');
    link.href = resultImage;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canSaveToLibrary = typeof window !== 'undefined'
    && window.matchMedia?.('(pointer:coarse)').matches
    && typeof navigator !== 'undefined'
    && !!navigator.share;
  const saveLabel = canSaveToLibrary ? 'Enregistrer dans la photothèque' : 'Télécharger le Résultat';
  const nextImprovementRound = (round > 0 ? round : 1) + 1;

  return (
    <div className="app-container" style={{
      width: '100%', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '2rem 1rem',
      overflowX: 'hidden'
    }}>
      {/* En-tête */}
      <header style={{ marginBottom: '2rem', textAlign: 'center', zIndex: 10 }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 200,
          marginBottom: '0.5rem',
          background: `linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-accent) 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        }}>
          Canova Morphing
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.9rem' }}>
          Simulation Avancée par IA pour Chirurgie Esthétique
        </p>
      </header>

      {/* Conteneur Principal */}
      <main style={{
        display: 'grid',
        gridTemplateColumns: step === 'upload' ? 'minmax(300px, 600px)'
          : step === 'setup' ? '400px 500px'
            : '350px 400px 1fr',
        gap: '2rem',
        alignItems: 'start',
        transition: 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)',
        width: '100%',
        maxWidth: step === 'result' ? '1600px' : step === 'setup' ? '1000px' : '600px',
      }} className="responsive-grid">

        {/* 1. Colonne Upload */}
        <div style={{ height: step === 'upload' ? '500px' : 'auto', transition: 'all 0.5s' }} className="animate-fade-in">
          {sourcePreview ? (
            <div className="glass-panel" style={{ position: 'relative', overflow: 'hidden', cursor: 'zoom-in' }} onClick={() => setFullScreenImg({ src: sourcePreview, label: 'Avant' })}>
              <img src={sourcePreview} alt="Before" style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '600px', objectFit: 'contain' }} />
              <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.8)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                AVANT
              </div>
              {step !== 'upload' && (
                <button onClick={(e) => { e.stopPropagation(); setStep('upload'); setSourcePreview(null); setSourceImage(null); }} style={{
                  position: 'absolute', top: 10, right: 10, background: 'white', borderRadius: '50%', width: 24, height: 24, padding: 0, fontSize: '0.8rem'
                }}>↺</button>
              )}
            </div>
          ) : (
            <ImageUpload onImageSelect={handleImageSelect} />
          )}
        </div>

        {/* 2. Colonne Contrôles */}
        {step !== 'upload' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animationDelay: '0.2s' }}>
            <ProcedureSelector selected={selectedProcedures} onToggle={toggleProcedure} />
            <DiagnosisInput value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />

            {error && (
              <div style={{ padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: 'var(--radius-sm)', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{
                padding: '1.25rem',
                background: 'var(--color-accent)',
                color: 'white',
                fontWeight: '600',
                fontSize: '1.1rem',
                borderRadius: 'var(--radius-lg)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                opacity: isGenerating ? 0.7 : 1,
                cursor: isGenerating ? 'wait' : 'pointer'
              }}
              onMouseOver={(e) => !isGenerating && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => !isGenerating && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {isGenerating ? 'Analyse en cours...' : step === 'result' ? 'Régénérer' : 'Générer la Simulation'}
            </button>
          </div>
        )}

        {/* 3. Colonne Résultat */}
        {step === 'result' && (
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="glass-panel" style={{ padding: '1rem', position: 'relative' }}>
              <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-md)', cursor: 'zoom-in' }} onClick={() => setFullScreenImg({ src: resultImage, label: 'Après' })}>
                <img src={resultImage} alt="After" style={{ width: '100%', height: 'auto', display: 'block' }} />
                <div style={{
                  position: 'absolute', top: 15, left: 15,
                  background: 'var(--color-accent)', color: 'white',
                  padding: '6px 12px', borderRadius: '20px',
                  fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em'
                }}>
                  APRÈS
                  {round > 1 && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', fontWeight: '600', opacity: 0.9 }}>
                      Tour {round}
                    </span>
                  )}
                </div>
              </div>
              <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', opacity: 0.75 }}>
                Simulation à titre indicatif, ne garantit pas un résultat identique.
              </p>

              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <button
                  onClick={handleSaveResult}
                  style={{
                    padding: '0.8rem 2rem',
                    border: '2px solid var(--color-accent)',
                    color: 'var(--color-accent)',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = 'white'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                >
                  {saveLabel}
                </button>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                  Améliorer le résultat (Tour {nextImprovementRound})
                </div>
                <textarea
                  className="glass-input"
                  style={{ width: '100%', minHeight: '90px', resize: 'vertical' }}
                  placeholder="Décrivez ce qu'il faut améliorer pour le prochain tour (ex: affiner la pointe du nez, augmenter légèrement la projection...)."
                  value={improvementNotes}
                  onChange={(e) => setImprovementNotes(e.target.value)}
                />
                <button
                  onClick={handleImprove}
                  disabled={isGenerating || !improvementNotes.trim()}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.7rem 1.5rem',
                    background: 'var(--color-accent)',
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: 'var(--radius-md)',
                    opacity: isGenerating || !improvementNotes.trim() ? 0.6 : 1,
                    cursor: isGenerating || !improvementNotes.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {isGenerating ? 'Amélioration en cours...' : `Améliorer (Tour ${nextImprovementRound})`}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Modal Plein Écran */}
      {fullScreenImg && (
        <FullScreenModal src={fullScreenImg.src} label={fullScreenImg.label} onClose={() => setFullScreenImg(null)} />
      )}

      {/* Style Responsif */}
      <style>{`
        @media (max-width: 1024px) {
            .responsive-grid {
                grid-template-columns: 1fr !important;
                max-width: 600px !important;
            }
        }
      `}</style>
    </div>
  );
}

export default App;
