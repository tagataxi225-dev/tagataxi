import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
] as const;

const DriverProfilLanguage = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>('fr');

  useEffect(() => {
    const stored = localStorage.getItem('kwenda_language');
    if (stored) setSelected(stored);
  }, []);

  const handleSelect = (code: string) => {
    setSelected(code);
    localStorage.setItem('kwenda_language', code);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className="p-2 rounded-full hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-base">Langue</span>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="bg-white rounded-xl border overflow-hidden">
          {LANGUAGES.map((lang, idx) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              aria-label={lang.label}
              className={`w-full flex items-center justify-between px-4 py-4 text-left active:bg-gray-50 transition-colors ${
                idx > 0 ? 'border-t border-gray-100' : ''
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              <span className="text-sm text-gray-900">{lang.label}</span>
              {selected === lang.code && (
                <Check className="w-5 h-5 text-emerald-600" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriverProfilLanguage;
