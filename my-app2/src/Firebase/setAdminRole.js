const admin = require("firebase-admin");

// Inicialize o SDK com a chave privada
const serviceAccount = require("./firebase-admin-key.json"); // Substitua pelo caminho do arquivo .json

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const setAdminRole = async (uid) => {
  try {
    // Adicionar o papel "admin" ao usuário
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log("Admin role set for user:", uid);
  } catch (error) {
    console.error("Error setting admin role:", error);
  }
};

// Substitua pelo UID do usuário ao qual deseja atribuir o papel de admin
setAdminRole("USER_UID_AQUI");
