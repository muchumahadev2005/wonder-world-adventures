require("dotenv").config();
const aiModelService = require("./src/modules/ai-model/ai-model.service");
const repository = require("./src/modules/ai-model/ai-model.repository");

async function main() {
  console.log("Checking DB model migration...");
  await aiModelService.ensureSeedDefaults();
  const models = await repository.listModels();
  console.log("Current DB models:");
  for (const m of models) {
    console.log(`- ID: ${m.id} | Name: ${m.displayName} | Slug: ${m.modelName}`);
    const testResult = await aiModelService.testModel(m.id);
    console.log(`  -> Test Result: status=${testResult.status}, error=${testResult.error || "none"}`);
  }
  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
