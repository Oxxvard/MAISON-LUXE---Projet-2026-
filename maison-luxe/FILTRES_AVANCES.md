# 🔍 Filtres Avancés - Documentation

## Vue d'ensemble

Les filtres avancés ont été ajoutés à la page `/produits` pour permettre aux utilisateurs de trouver facilement les produits qui les intéressent.

## Filtres Disponibles

### 1. **Filtre Prix** 💰
- **Type:** Double range slider
- **Fonctionnalité:** Permet de définir un prix minimum et maximum
- **Calcul dynamique:** Le prix maximum s'ajuste automatiquement selon les produits disponibles
- **API:** `?minPrice=50&maxPrice=500`

### 2. **Filtre Notes** ⭐
- **Type:** Sélection par étoiles (1-4 étoiles)
- **Fonctionnalité:** Affiche uniquement les produits avec une note minimale
- **Options:**
  - Toutes les notes
  - 1+ étoile
  - 2+ étoiles
  - 3+ étoiles
  - 4+ étoiles
- **API:** `?minRating=3`

### 3. **Filtre Disponibilité** 📦
- **Type:** Checkbox
- **Fonctionnalité:** Affiche uniquement les produits en stock
- **API:** `?inStock=true`

### 4. **Filtre Catégorie** 🏷️
- **Type:** Boutons de sélection
- **Fonctionnalité:** Filtre par catégorie de produit
- **API:** `?category=categoryId`

### 5. **Tri** 📊
- **Options disponibles:**
  - Plus récents (`-createdAt`)
  - Prix croissant (`price`)
  - Prix décroissant (`-price`)
  - Meilleures notes (`-rating`)
  - Nom A-Z (`name`)
- **API:** `?sort=-price`

## Fonctionnalités UX

### Badge de Filtres Actifs
- **Mobile:** Badge numérique sur le bouton "Filtres" indiquant le nombre de filtres actifs
- **Exemple:** Si prix + notes sont filtrés → Badge "2"

### Bouton Réinitialiser
- **Desktop & Mobile:** Bouton permettant de réinitialiser tous les filtres en un clic
- **Action:** Remet tous les filtres à leur valeur par défaut

### Responsive Design
- **Desktop:** Sidebar fixe avec tous les filtres visibles
- **Mobile:** Panneau latéral déroulant avec bouton flottant

## API Backend

### Endpoint
`GET /api/products`

### Query Parameters Supportés
```typescript
{
  category?: string;        // ID de catégorie
  featured?: 'true';        // Produits en vedette
  sort?: string;            // Ordre de tri
  limit?: number;           // Limite de résultats (défaut: 50)
  minPrice?: number;        // Prix minimum
  maxPrice?: number;        // Prix maximum
  minRating?: number;       // Note minimale (0-5)
  inStock?: 'true';         // Seulement produits en stock
}
```

### Exemple de Requête
```bash
GET /api/products?category=abc123&minPrice=100&maxPrice=500&minRating=3&inStock=true&sort=-price
```

### Logique de Filtrage MongoDB
```typescript
const query: any = {};

// Catégorie
if (category) {
  query.category = category;
}

// Prix
if (minPrice || maxPrice) {
  query.price = {};
  if (minPrice) query.price.$gte = parseFloat(minPrice);
  if (maxPrice) query.price.$lte = parseFloat(maxPrice);
}

// Note
if (minRating && parseFloat(minRating) > 0) {
  query.rating = { $gte: parseFloat(minRating) };
}

// Stock
if (inStock === 'true') {
  query.stock = { $gt: 0 };
}

const products = await Product.find(query)
  .populate('category', 'name slug')
  .sort(sort)
  .limit(limit);
```

## Performance

### Optimisations
- **Caching:** Cache HTTP 60s avec stale-while-revalidate 120s
- **Indexes MongoDB:** Recommandé de créer des indexes sur:
  - `price`
  - `rating`
  - `stock`
  - `category`
  - `createdAt`

### Création des Indexes
```javascript
// Dans MongoDB
db.products.createIndex({ price: 1 });
db.products.createIndex({ rating: -1 });
db.products.createIndex({ stock: 1 });
db.products.createIndex({ category: 1 });
db.products.createIndex({ createdAt: -1 });

// Index composé pour filtres multiples
db.products.createIndex({ category: 1, price: 1, rating: -1 });
```

## État Frontend

### Variables d'État
```typescript
const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
const [minRating, setMinRating] = useState<number>(0);
const [inStockOnly, setInStockOnly] = useState<boolean>(false);
const [maxPrice, setMaxPrice] = useState<number>(1000);
const [selectedCategory, setSelectedCategory] = useState<string>('');
const [sortBy, setSortBy] = useState<string>('-createdAt');
```

### Re-fetch Automatique
Les produits sont rechargés automatiquement à chaque changement de filtre via `useEffect` :
```typescript
useEffect(() => {
  fetchProducts();
}, [selectedCategory, sortBy, priceRange, minRating, inStockOnly]);
```

## Tests

### Tests Manuels
1. **Filtre Prix:**
   - Ajuster le slider min → Vérifier que seuls les produits >= prix min apparaissent
   - Ajuster le slider max → Vérifier que seuls les produits <= prix max apparaissent

2. **Filtre Notes:**
   - Sélectionner "3+ étoiles" → Vérifier que seuls les produits avec rating >= 3 apparaissent

3. **Filtre Stock:**
   - Activer "En stock uniquement" → Vérifier que seuls les produits avec stock > 0 apparaissent

4. **Combinaisons:**
   - Activer plusieurs filtres → Vérifier que l'intersection des résultats est correcte

### Tests Automatisés (À créer)
```typescript
// tests/filters.test.ts
describe('Filtres Produits', () => {
  it('devrait filtrer par prix minimum', async () => {
    const res = await fetch('/api/products?minPrice=100');
    const data = await res.json();
    expect(data.every(p => p.price >= 100)).toBe(true);
  });

  it('devrait filtrer par note minimale', async () => {
    const res = await fetch('/api/products?minRating=4');
    const data = await res.json();
    expect(data.every(p => p.rating >= 4)).toBe(true);
  });

  it('devrait filtrer par stock', async () => {
    const res = await fetch('/api/products?inStock=true');
    const data = await res.json();
    expect(data.every(p => p.stock > 0)).toBe(true);
  });
});
```

## Améliorations Futures

### Court Terme
- [ ] Ajouter des facettes (nombre de produits par filtre)
- [ ] Sauvegarder les filtres dans l'URL pour partage
- [ ] Animation smooth lors du changement de filtres

### Moyen Terme
- [ ] Filtre par marque/vendor
- [ ] Filtre par couleur
- [ ] Filtre par taille
- [ ] Filtre par matériau

### Long Terme
- [ ] Recherche textuelle avec autocomplete
- [ ] Filtres intelligents basés sur l'historique utilisateur
- [ ] Recommandations personnalisées

## Compatibilité

- ✅ Next.js 15/16
- ✅ React 18+
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Mobile & Desktop
- ✅ MongoDB

## Support

Pour toute question ou bug, créer une issue sur le repo GitHub.

---

**Dernière mise à jour:** 13 janvier 2026  
**Version:** 1.0.0
