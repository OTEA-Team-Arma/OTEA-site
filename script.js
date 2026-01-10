document.addEventListener('DOMContentLoaded', () => {
    let percent = 0;
    const syncPercent = document.getElementById('sync-percent');
    const syncFill = document.getElementById('sync-fill');
    const briefingButton = document.getElementById('briefing-button');
    const serverButton = document.getElementById('server-button');

    // Bouton serveur actif dès le départ
    serverButton.onclick = () => window.open("ts3server://TS3.otea.fr", "_blank");

    // Charger la mission de la semaine
    chargerMissionHebdo();

    // Animation de chargement
    const syncInterval = setInterval(() => {
        if (percent < 100) {
            percent++;
            syncPercent.textContent = percent;
            syncFill.style.width = percent + '%';
        } else {
            clearInterval(syncInterval);
            briefingButton.classList.remove('hidden'); 
            briefingButton.onclick = () => window.location.href = "https://otea.forum-pro.fr/";
        }
    }, 30);
});

// Fonction pour charger la mission
function chargerMissionHebdo() {
    console.log('Chargement de la mission depuis mission.json...');
    fetch('mission.json')
        .then(response => {
            if (!response.ok) throw new Error('Fichier mission.json non trouvé');
            return response.json();
        })
        .then(mission => {
            if (mission && mission.titre && mission.date) {
                if (verifierDateSemaine(mission.date)) {
                    console.log('✓ Mission active cette semaine');
                    afficherMissionActive(mission);
                } else {
                    console.log('Mission trouvée mais hors de la semaine actuelle');
                    afficherStandBy();
                }
            } else {
                console.log('Aucune mission trouvée dans mission.json');
                afficherStandBy();
            }
        })
        .catch(error => {
            console.log('Erreur lors du chargement de mission.json :', error);
            afficherStandBy();
        });
}

// Vérifie si une date (JJ/MM/AAAA ou JJ/MM) est dans la semaine actuelle
function verifierDateSemaine(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length < 2) return false;
    
    const jour = parseInt(parts[0]);
    const mois = parseInt(parts[1]);
    const annee = parts.length === 3 ? parseInt(parts[2]) : new Date().getFullYear();
    
    if (jour < 1 || jour > 31 || mois < 1 || mois > 12) return false;
    
    const dateMission = new Date(annee, mois - 1, jour);
    const maintenant = new Date();
    const jourSemaine = maintenant.getDay();
    const diffLundi = (jourSemaine === 0 ? -6 : 1) - jourSemaine;
    
    const debutSemaine = new Date(maintenant);
    debutSemaine.setDate(maintenant.getDate() + diffLundi);
    debutSemaine.setHours(0, 0, 0, 0);
    
    const finSemaine = new Date(debutSemaine);
    finSemaine.setDate(debutSemaine.getDate() + 6);
    finSemaine.setHours(23, 59, 59, 999);
    
    console.log(`Vérification: ${dateMission.toLocaleDateString('fr-FR')} entre ${debutSemaine.toLocaleDateString('fr-FR')} et ${finSemaine.toLocaleDateString('fr-FR')}`);
    
    return dateMission >= debutSemaine && dateMission <= finSemaine;
}

// Affiche une mission active
function afficherMissionActive(mission) {
    document.getElementById('mission-status').textContent = '✓ MISSION ACTIVE';
    document.getElementById('mission-status').classList.remove('standby');
    document.getElementById('mission-title').textContent = mission.titre.toUpperCase();
    const heure = mission.heure || '21H00';
    document.getElementById('mission-date').textContent = `DATE : ${mission.date} - ${heure}`;
    document.getElementById('mission-desc').textContent = mission.description;
    
    // Afficher le bouton briefing s'il y a un lien
    const briefingBtn = document.getElementById('mission-briefing-btn');
    if (mission.lienBriefing && briefingBtn) {
        briefingBtn.style.display = 'block';
        briefingBtn.onclick = () => window.open(mission.lienBriefing, '_blank');
    }
}

// Affiche le mode stand-by
function afficherStandBy() {
    const statusEl = document.getElementById('mission-status');
    statusEl.textContent = '⚠ STAND-BY : AUCUNE OPÉRATION';
    statusEl.classList.add('standby');
    document.getElementById('mission-title').textContent = 'EN ATTENTE D\'ORDRES';
    document.getElementById('mission-date').textContent = 'Prochaine mission : À déterminer';
    document.getElementById('mission-desc').textContent = 'Aucune opération planifiée pour cette semaine. Consultez le forum pour plus d\'informations.';
    
    // Masquer le bouton briefing
    const briefingBtn = document.getElementById('mission-briefing-btn');
    if (briefingBtn) briefingBtn.style.display = 'none';
}

// Gestion des textes d'information
const infoText = {
    team: `
        <h2>UNITÉ OTEA</h2>
        <p><strong>Présents depuis 2011.</strong> Nous sommes avant tout un groupe d'amis passionnés par l'évolution de la simulation sur ARMA.</p>
        <p><strong>OPÉRATIONS :</strong> Nous jouons en groupe organisé de manière coopérative tous les <strong>vendredis soirs à 21h00</strong>.</p>
        <ul>
            <li><strong>Missions Publiques :</strong> Nous organisons une session ouverte chaque premier vendredi du mois pour vous rencontrer.</li>
            <li><strong>Milsim détendu :</strong> Un équilibre entre sérieux en mission et convivialité hors combat.</li>
            <li><strong>Expertise :</strong> Infanterie tactique, assauts multi-milieux et neutralisation d'objectifs.</li>
        </ul>
        <p><em>"Un chef, des rôles définis et une mission accomplie dans la bonne humeur !"</em></p>
    `,
    recrutement: `
        <h2>RECRUTEMENT</h2>
        <p>Nous recherchons des joueurs motivés, quel que soit leur niveau. L'important est l'état d'esprit.</p>
        <ul>
            <li><strong>Âge requis :</strong> 18 ans minimum.</li>
            <li><strong>Phase de test :</strong> Participation à quelques missions pour faire connaissance.</li>
            <li><strong>Profil :</strong> Esprit d'équipe, respect des consignes et maturité.</li>
            <li><strong>Processus :</strong> Postulez sur notre forum dans la section dédiée.</li>
        </ul>
        <p><em>"Votre place parmi nous se gagne sur le terrain, dans la cohésion."</em></p>
    `,
   contact: `
    <h2>NOUS CONTACTER</h2>
    <p>Cliquez sur l'un des vecteurs ci-dessous pour nous rejoindre immédiatement :</p>
    <div class="contact-links">
        <a href="ts3server://TS3.otea.fr" class="contact-item">
            <strong>TEAMSPEAK :</strong> TS3.otea.fr
        </a>
        <br><br>
        <a href="https://discord.gg/G9sd4TxQ" target="_blank" class="contact-item">
            <strong>DISCORD :</strong> Rejoindre le serveur
        </a>
    </div>
    <p style="margin-top:20px;"><em>L'équipe est à votre disposition pour toute question relative à nos serveurs.</em></p>
`
};

function openModal(type) {
    document.getElementById('modal-body').innerHTML = infoText[type];
    document.getElementById('modal-container').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-container').classList.add('hidden');
}
