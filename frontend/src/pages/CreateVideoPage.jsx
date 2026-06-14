import React, { useState, useCallback } from "react";
import PromptInput from "../components/PromptInput.jsx";
import ScriptCards from "../components/ScriptCards.jsx";
import SceneGrid from "../components/SceneGrid.jsx";
import VideoPlayer from "../components/VideoPlayer.jsx";
import AudioSelector from "../components/AudioSelector.jsx";
import StepIndicator from "../components/StepIndicator.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { generateScripts, generateImages, regenerateImage, generateVideo } from "../services/api.js";

const STEP_PROMPT = 0;
const STEP_SCRIPTS = 1;
const STEP_IMAGES = 2;
const STEP_AUDIO = 3;
const STEP_VIDEO = 4;

export default function CreateVideoPage() {
  const [step, setStep] = useState(STEP_PROMPT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [prompt, setPrompt] = useState("");
  const [scripts, setScripts] = useState([]);
  const [selectedScriptId, setSelectedScriptId] = useState(null);
  const [editedScripts, setEditedScripts] = useState({});
  const [images, setImages] = useState([]);
  const [jobId, setJobId] = useState(null);
  const [audioSettings, setAudioSettings] = useState({ music: null, voiceover: null });
  const [videoUrl, setVideoUrl] = useState(null);

  // ── helpers ──────────────────────────────────────────────────────────────

  const getSelectedScript = useCallback(() => {
    const base = scripts.find((s) => s.id === selectedScriptId);
    if (!base) return null;
    const edits = editedScripts[selectedScriptId];
    if (!edits) return base;
    return {
      ...base,
      title: edits.title ?? base.title,
      scenes: base.scenes.map((sc, i) => ({
        ...sc,
        narration: edits.scenes?.[i]?.narration ?? sc.narration,
        visualPrompt: edits.scenes?.[i]?.visualPrompt ?? sc.visualPrompt,
      })),
    };
  }, [scripts, selectedScriptId, editedScripts]);

  // ── step handlers ─────────────────────────────────────────────────────────

  const handleGenerateScripts = useCallback(async (userPrompt) => {
    setError(null);
    setIsLoading(true);
    setPrompt(userPrompt);
    try {
      const result = await generateScripts(userPrompt);
      if (!result.scripts?.length) throw new Error("No scripts returned. Please try again.");
      setScripts(result.scripts);
      setSelectedScriptId(null);
      setEditedScripts({});
      setStep(STEP_SCRIPTS);
    } catch (err) {
      setError(err.message || "Failed to generate scripts.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleScriptEdit = useCallback((scriptId, field, value, sceneIndex) => {
    setEditedScripts((prev) => {
      const existing = prev[scriptId] || { scenes: {} };
      if (field === "title") {
        return { ...prev, [scriptId]: { ...existing, title: value } };
      }
      if (field === "narration" || field === "visualPrompt") {
        const scenes = { ...(existing.scenes || {}) };
        scenes[sceneIndex] = { ...(scenes[sceneIndex] || {}), [field]: value };
        return { ...prev, [scriptId]: { ...existing, scenes } };
      }
      return prev;
    });
  }, []);

  const handleGenerateImages = useCallback(async () => {
    const script = getSelectedScript();
    if (!script) return;
    setError(null);
    setIsLoading(true);
    try {
      const result = await generateImages(script.scenes, jobId, script.title, script.style);
      if (!result.images?.length) throw new Error("No images returned. Please try again.");
      setJobId(result.jobId);
      setImages(result.images);
      setStep(STEP_IMAGES);
    } catch (err) {
      setError(err.message || "Failed to generate images.");
    } finally {
      setIsLoading(false);
    }
  }, [getSelectedScript, jobId]);

  const handleRegenerateImage = useCallback(async (scene) => {
    const script = getSelectedScript();
    if (!script || !jobId) return;
    try {
      const result = await regenerateImage(scene, jobId, script.title, script.style);
      setImages((prev) =>
        prev.map((img) => (img.sceneNumber === scene.sceneNumber ? result : img))
      );
    } catch (err) {
      setError(err.message || "Failed to regenerate image.");
    }
  }, [getSelectedScript, jobId]);

  const handleGenerateVideo = useCallback(async (audioSettings) => {
    const script = getSelectedScript();
    if (!jobId || images.length === 0 || !script) return;
    setError(null);
    setIsLoading(true);
    try {
      const scenesForVideo = images.map((img, i) => {
        const filename = img.imageUrl.split('/').pop();
        return {
          sceneNumber: img.sceneNumber,
          localPath: `outputs/${filename}`,
          narration: script.scenes[i]?.narration || "",
        };
      });
      const result = await generateVideo(jobId, scenesForVideo, audioSettings);
      if (!result.videoUrl) throw new Error("Video URL not returned. Please try again.");
      setVideoUrl(result.videoUrl);
      setStep(STEP_VIDEO);
    } catch (err) {
      setError(err.message || "Failed to generate video.");
    } finally {
      setIsLoading(false);
    }
  }, [jobId, images, getSelectedScript]);

  const handleAudioContinue = useCallback((settings) => {
    setAudioSettings(settings);
    handleGenerateVideo(settings);
  }, [handleGenerateVideo]);

  const handleRestart = useCallback(() => {
    setStep(STEP_PROMPT);
    setScripts([]);
    setSelectedScriptId(null);
    setEditedScripts({});
    setImages([]);
    setJobId(null);
    setVideoUrl(null);
    setAudioSettings({ music: null, voiceover: null });
    setError(null);
    setIsLoading(false);
    setPrompt("");
  }, []);

  const goBack = useCallback(() => {
    setError(null);
    if (step > STEP_PROMPT) setStep((s) => s - 1);
  }, [step]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "var(--c-bg)", paddingBottom: 80 }}>
      {/* Ambient blobs */}
      <div style={{
        position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)",
        width: 900, height: 600,
        background: "radial-gradient(ellipse, rgba(124,92,252,0.13) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: 0, right: -100,
        width: 500, height: 500,
        background: "radial-gradient(ellipse, rgba(252,92,125,0.07) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "60px 24px 0" }}>
        {step > STEP_PROMPT && (
          <StepIndicator currentStep={step} totalSteps={5} onBack={goBack} />
        )}

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {step === STEP_PROMPT && (
          <PromptInput onGenerate={handleGenerateScripts} isLoading={isLoading} />
        )}

        {step === STEP_SCRIPTS && (
          <ScriptCards
            scripts={scripts}
            selectedId={selectedScriptId}
            editedScripts={editedScripts}
            onSelect={setSelectedScriptId}
            onEdit={handleScriptEdit}
            onContinue={handleGenerateImages}
            onBack={goBack}
            isLoading={isLoading}
          />
        )}

        {step === STEP_IMAGES && (
          <SceneGrid
            images={images}
            onRegenerate={handleRegenerateImage}
            onContinue={() => setStep(STEP_AUDIO)}
            onBack={goBack}
            isLoading={isLoading}
          />
        )}

        {step === STEP_AUDIO && (
          <AudioSelector
            onContinue={handleAudioContinue}
            onBack={goBack}
            isLoading={isLoading}
          />
        )}

        {step === STEP_VIDEO && videoUrl && (
          <VideoPlayer videoUrl={videoUrl} onRestart={handleRestart} audioSettings={audioSettings} />
        )}
      </div>
    </div>
  );
}