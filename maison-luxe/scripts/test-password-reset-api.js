/**
 * Script de test pour la fonctionnalité de reset password via API
 */

require('dotenv').config();

const testEmail = process.argv[2] || 'admin@maisonluxe.com';

async function testPasswordResetAPI() {
  try {
    console.log('🧪 Test de la fonctionnalité Password Reset\n');
    console.log('📧 Email de test:', testEmail);
    console.log('🌐 Server doit être démarré sur http://localhost:3000\n');

    // Test 1: Demander un reset password
    console.log('▶️  Test 1: POST /api/auth/forgot-password');
    const forgotResponse = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });

    const forgotData = await forgotResponse.json();
    console.log('   Status:', forgotResponse.status);
    console.log('   Response:', JSON.stringify(forgotData, null, 2));

    if (forgotResponse.ok) {
      console.log('   ✅ Requête de reset envoyée avec succès\n');

      // En mode dev, on devrait avoir le resetUrl
      if (forgotData.data?.resetUrl) {
        console.log('   🔗 Lien de reset (dev mode):');
        console.log('   ' + forgotData.data.resetUrl + '\n');

        // Extraire le token de l'URL
        const urlParts = forgotData.data.resetUrl.split('/');
        const token = urlParts[urlParts.length - 1];
        console.log('   🎫 Token extrait:', token);

        // Test 2: Réinitialiser le mot de passe avec le token
        console.log('\n▶️  Test 2: POST /api/auth/reset-password');
        const resetResponse = await fetch('http://localhost:3000/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            token, 
            password: 'NewPassword123!@#' 
          }),
        });

        const resetData = await resetResponse.json();
        console.log('   Status:', resetResponse.status);
        console.log('   Response:', JSON.stringify(resetData, null, 2));

        if (resetResponse.ok) {
          console.log('   ✅ Mot de passe réinitialisé avec succès\n');
        } else {
          console.log('   ❌ Erreur lors de la réinitialisation\n');
        }
      } else {
        console.log('   ⚠️  Pas de resetUrl dans la réponse (email envoyé ?)\n');
      }
    } else {
      console.log('   ❌ Erreur lors de la demande de reset\n');
    }

    console.log('✨ Tests terminés !\n');
    console.log('📝 Pour tester manuellement:');
    console.log('   1. http://localhost:3000/auth/signin');
    console.log('   2. Cliquer sur "Mot de passe oublié ?"');
    console.log('   3. Entrer votre email');
    console.log('   4. Vérifier la console pour le lien de reset (dev mode)');
    console.log('   5. Ouvrir le lien et définir un nouveau mot de passe\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.cause) {
      console.error('   Cause:', error.cause.message);
    }
    console.log('\n⚠️  Assurez-vous que le serveur Next.js est démarré:');
    console.log('   npm run dev\n');
  }
}

testPasswordResetAPI();
