<?php
// update-mission.php - Script pour sauvegarder la mission

// Autoriser les requêtes CORS (si nécessaire)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Vérifier que c'est une requête POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    exit;
}

// Récupérer les données JSON
$input = file_get_contents('php://input');
$mission = json_decode($input, true);

// Validation
if (!$mission || !isset($mission['titre']) || !isset($mission['date'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Données invalides']);
    exit;
}

// Nettoyer les données pour éviter les injections
$titre = htmlspecialchars($mission['titre'], ENT_QUOTES, 'UTF-8');
$date = htmlspecialchars($mission['date'], ENT_QUOTES, 'UTF-8');
$heure = htmlspecialchars($mission['heure'], ENT_QUOTES, 'UTF-8');
$description = htmlspecialchars($mission['description'], ENT_QUOTES, 'UTF-8');
$lienBriefing = htmlspecialchars($mission['lienBriefing'], ENT_QUOTES, 'UTF-8');

// Générer le contenu du fichier JavaScript
$jsContent = <<<JS
// ============================================
// 🎯 CONFIGURATION MISSION - METTEZ À JOUR ICI
// ============================================
// 
// Quand vous postez une mission sur Discord,
// copiez les infos ici et enregistrez le fichier.
// Rechargez ensuite votre site.

const MISSION = {
    titre: "$titre",
    date: "$date",
    heure: "$heure",
    description: "$description",
    lienBriefing: "$lienBriefing"
};

// Ne modifiez rien en dessous de cette ligne
// ============================================
JS;


// Sauvegarder dans js/mission-config.js
$result = file_put_contents('../js/mission-config.js', $jsContent);

if ($result === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Impossible d\'écrire le fichier']);
    exit;
}

// Succès
echo json_encode([
    'success' => true,
    'message' => 'Mission mise à jour avec succès'
]);
?>
