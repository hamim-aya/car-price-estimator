import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import carImage from './voiture.png';

const API_CONFIG = {
  BASE_URL: 'http://127.0.0.1:8000',
  ENDPOINTS: {
    BRANDS: '/brands',
    MODELS: '/models',
    PREDICT: '/predict'
  }
};

const OPTIONS = {
  TRANSMISSION: ['manuelle', 'automatique'],
  FUEL_TYPES: ['Essence', 'Diesel', 'Hybride', 'Electrique', 'LPG'],
  OWNERSHIP: ['Oui', 'Non', 'Autre'],
  CONDITIONS: ['Excellent', 'Bon', 'Très bon', 'Neuf', 'Correct', 'Endommagé', 'Pour Pièces'],
  ORIGINS: ['WW au Maroc', 'Importée neuve', 'Dédouanée', 'Autre', 'Pas encore dédouanée']
};

function CarPricePredictor() {
  const [formData, setFormData] = useState({
    marke: '',
    model: '',
    Année_Modèle: '',
    kilometrage: '',
    Nombre_de_portes: '4',
    Puissance_fiscale: '',
    Première_main: 'Non',
    type_boit: 'manuelle',
    type_carburant: 'Essence',
    État: 'Bon',
    Origine: 'WW au Maroc',

  });
const [darkMode, setDarkMode] = useState(false);

  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState({
    brands: false,
    models: false,
    prediction: false
  });
  const [errors, setErrors] = useState({});
  const [prediction, setPrediction] = useState(null);
useEffect(() => {
  document.body.className = darkMode ? "dark" : "light";
}, [darkMode]);

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(prev => ({ ...prev, brands: true }));
      try {
        const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BRANDS}`);
        setBrands(response.data.brands || []);
      } catch (error) {
        console.error("Erreur chargement marques:", error);
        setErrors(prev => ({ ...prev, api: "Erreur chargement des marques" }));
      } finally {
        setLoading(prev => ({ ...prev, brands: false }));
      }
    };
    fetchBrands();
  }, []);

  useEffect(() => {
    if (formData.marke) {
      const fetchModels = async () => {
        setLoading(prev => ({ ...prev, models: true }));
        try {
          const response = await axios.get(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MODELS}/${formData.marke}`
          );
          setModels(response.data.models || []);
        } catch (error) {
          console.error("Erreur chargement modèles:", error);
        } finally {
          setLoading(prev => ({ ...prev, models: false }));
        }
      };
      fetchModels();
    } else {
      setModels([]);
    }
  }, [formData.marke]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'marke') {
      setFormData(prev => ({ ...prev, model: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const currentYear = new Date().getFullYear();

    if (!formData.marke) newErrors.marke = 'Marque requise';
    if (!formData.model) newErrors.model = 'Modèle requis';
    if (!formData.Année_Modèle || formData.Année_Modèle < 1990 || formData.Année_Modèle > currentYear) {
      newErrors.Année_Modèle = `Année invalide (1990-${currentYear})`;
    }
    if (!formData.kilometrage || formData.kilometrage < 0) newErrors.kilometrage = 'Kilométrage invalide';
    if (!formData.Puissance_fiscale || formData.Puissance_fiscale <= 0) {
      newErrors.Puissance_fiscale = 'Puissance fiscale requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(prev => ({ ...prev, prediction: true }));
    setPrediction(null);

    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PREDICT}`,
        formData
      );

      setPrediction({
  price: response.data.predicted_price,
  confidence: response.data.confidence || null
});

// 🎵 Lecture du son après prédiction réussie
const audio = new Audio(process.env.PUBLIC_URL + '/beep.mp3');
audio.play().catch((e) => console.log("Lecture audio bloquée :", e));

    } catch (error) {
      console.error("Erreur prédiction:", error);
      setErrors(prev => ({ ...prev, api: error.response?.data?.detail || "Erreur serveur" }));
    } finally {
      setLoading(prev => ({ ...prev, prediction: false }));
    }
  };


  return (

    <div className="app-container">
      {/* Section d'introduction */}
      <div className="intro-section">
        <div className="intro-content">
          <div className="intro-text">
            <h2></h2>
            <h1 className="main-title">Your Car</h1>
            <p>
              Notre application intelligente vous aide à estimer la valeur réelle de votre voiture
              en fonction de ses caractéristiques. Obtenez une estimation fiable en quelques clics !
            </p>
            <button className="cta-button">Estimer le prix de votre voiture</button>
          </div>
          <div className="intro-image">
            <img src={carImage} alt="Voiture" />
          </div>
        </div>
      </div>

      {/* Formulaire d'estimation */}
      <div className="form-section">
        <form onSubmit={handleSubmit} className="prediction-form">
          {/* Première ligne - 3 champs */}
          <div className="form-row">
            <div className={`form-group ${errors.marke ? 'has-error' : ''}`}>
              <label>Marque *</label>
              <select
                name="marke"
                value={formData.marke}
                onChange={handleChange}
                disabled={loading.brands}
                required
              >
                <option value="">{loading.brands ? 'Chargement...' : '-- Sélectionnez --'}</option>
                {brands.map((brand, index) => (
                  <option key={index} value={brand}>{brand}</option>
                ))}
              </select>
              {errors.marke && <span className="error-text">{errors.marke}</span>}
            </div>

            <div className={`form-group ${errors.model ? 'has-error' : ''}`}>
              <label>Modèle *</label>
              <select
                name="model"
                value={formData.model}
                onChange={handleChange}
                disabled={!formData.marke || loading.models}
                required
              >
                <option value="">{loading.models ? 'Chargement...' : '-- Sélectionnez --'}</option>
                {models.map((model, index) => (
                  <option key={index} value={model}>{model}</option>
                ))}
              </select>
              {errors.model && <span className="error-text">{errors.model}</span>}
            </div>

            <div className={`form-group ${errors.Année_Modèle ? 'has-error' : ''}`}>
              <label>Année *</label>
              <input
                type="number"
                name="Année_Modèle"
                value={formData.Année_Modèle}
                onChange={handleChange}
                placeholder="2020"
                min="1990"
                max={new Date().getFullYear()}
                required
              />
              {errors.Année_Modèle && <span className="error-text">{errors.Année_Modèle}</span>}
            </div>
          </div>

          {/* Deuxième ligne - 3 champs */}
          <div className="form-row">
            <div className={`form-group ${errors.kilometrage ? 'has-error' : ''}`}>
              <label>Kilométrage (km) *</label>
              <input
                type="number"
                name="kilometrage"
                value={formData.kilometrage}
                onChange={handleChange}
                placeholder="50000"
                min="0"
                required
              />
              {errors.kilometrage && <span className="error-text">{errors.kilometrage}</span>}
            </div>

            <div className="form-group">
              <label>Boîte de vitesses</label>
              <select
                name="type_boit"
                value={formData.type_boit}
                onChange={handleChange}
              >
                {OPTIONS.TRANSMISSION.map(trans => (
                  <option key={trans} value={trans}>
                    {trans.charAt(0).toUpperCase() + trans.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Carburant</label>
              <select
                name="type_carburant"
                value={formData.type_carburant}
                onChange={handleChange}
              >
                {OPTIONS.FUEL_TYPES.map(fuel => (
                  <option key={fuel} value={fuel}>{fuel}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Troisième ligne - 3 champs */}
          <div className="form-row">
            <div className={`form-group ${errors.Puissance_fiscale ? 'has-error' : ''}`}>
              <label>Puissance fiscale (CV) *</label>
              <input
                type="number"
                name="Puissance_fiscale"
                value={formData.Puissance_fiscale}
                onChange={handleChange}
                placeholder="5.5"
                step="0.1"
                min="0"
                required
              />
              {errors.Puissance_fiscale && <span className="error-text">{errors.Puissance_fiscale}</span>}
            </div>

            <div className="form-group">
              <label>Première main</label>
              <select
                name="Première_main"
                value={formData.Première_main}
                onChange={handleChange}
              >
                {OPTIONS.OWNERSHIP.map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>État du véhicule</label>
              <select
                name="État"
                value={formData.État}
                onChange={handleChange}
              >
                {OPTIONS.CONDITIONS.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>
          </div>
         {/* Nouvelle ligne pour Origine et Nombre de portes */}
<div className="form-row">
  <div className="form-group">
    <label>Origine</label>
    <select
      name="Origine"
      value={formData.Origine}
      onChange={handleChange}
    >
      <option value="WW au Maroc">WW au Maroc</option>
      <option value="Importée neuve">Importée neuve</option>
      <option value="Dédouanée">Dédouanée</option>
      <option value="Autre">Autre</option>
      <option value="Pas encore dédouanée">Pas encore dédouanée</option>
    </select>
  </div>

  <div className="form-group">
    <label>Nombre de portes</label>
    <select
      name="Nombre_de_portes"
      value={formData.Nombre_de_portes}
      onChange={handleChange}
    >
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
    </select>
  </div>
</div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading.prediction}
          >
            {loading.prediction ? 'Estimation en cours...' : 'Obtenir une estimation'}
          </button>
        </form>
      </div>

      {/* Résultats */}
      {prediction && (
        <div className="result-section">
          <div className="result-card">
            <h2>Résultat de l'estimation</h2>
            <div className="price-result">
              <span className="price">{Math.round(prediction.price).toLocaleString('fr-FR')} MAD</span>
              {prediction.confidence && (
                <span className="confidence">
                  Fiabilité: {typeof prediction.confidence === 'number' ?
                  Math.round(prediction.confidence * 10) / 10 : 'N/A'}/10
                </span>
              )}
            </div>
            <p className="disclaimer">

            </p>
          </div>
        </div>
      )}
    </div>

  );

}

export default CarPricePredictor;