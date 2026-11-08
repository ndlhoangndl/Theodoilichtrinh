import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const workspaceDir='D:/Code/Lichtrinh';
const SKILL_DIR='C:/Users/Admin/.codex/plugins/cache/openai-primary-runtime/presentations/26.1025.11240/skills/Presentations';
const RUNTIME_PYTHON='C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const FINAL_PPTX=path.join(workspaceDir,'deliverables','Lich-Trinh-De-Tai-Lap-Trinh-Di-Dong-10-Slides.pptx');
const candidatePath=path.join(workspaceDir,'.codex-build','lichtrinh-slides','lich-trinh-de-tai-10-slides-draft.pptx');
const stagingDir=path.join(workspaceDir,'.codex-finalizer');
await fs.mkdir(stagingDir,{recursive:true}); await fs.mkdir(path.dirname(FINAL_PPTX),{recursive:true});
const { finalizePresentation }=await import(pathToFileURL(path.join(SKILL_DIR,'container_tools/artifact_tool_utils.mjs')).href);
const result=await finalizePresentation({
 workspaceDir,candidatePath,finalPath:FINAL_PPTX,pythonExecutable:RUNTIME_PYTHON,
 integrityValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],
 explicitTotalSlideCount:10,
 requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],
 fontPolicy:{basis:'design',families:['Arial']},verifyArtifactToolImport:true,
 receiptPath:path.join(stagingDir,'lich-trinh-slides-validation.json')
});
console.log(JSON.stringify(result));
