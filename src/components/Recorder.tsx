"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Visibility = "private" | "custode" | "public";

export default function Recorder({ userId }: { userId: string }) {
  const supabase = createClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startCamera() {
    setStatus(null);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      await videoRef.current.play();
    }
  }

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm",
    });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.muted = false;
        videoRef.current.src = URL.createObjectURL(blob);
      }
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setRecording(false);
  }

  function resetRecording() {
    setRecordedBlob(null);
    if (videoRef.current) {
      videoRef.current.src = "";
    }
  }

  async function upload() {
    if (!recordedBlob) return;
    setUploading(true);
    setStatus(null);

    const fileName = `${userId}/${crypto.randomUUID()}.webm`;

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(fileName, recordedBlob, { contentType: "video/webm" });

    if (uploadError) {
      setStatus(`Errore durante il caricamento: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase.from("videos").insert({
      user_id: userId,
      storage_path: fileName,
      title: title || null,
      visibility,
    });

    setUploading(false);

    if (insertError) {
      setStatus(`Errore nel salvataggio: ${insertError.message}`);
      return;
    }

    setStatus("Messaggio salvato correttamente.");
    setRecordedBlob(null);
    setTitle("");
  }

  return (
    <div className="flex flex-col gap-4">
      <video
        ref={videoRef}
        controls={!!recordedBlob}
        playsInline
        className="aspect-video w-full rounded-lg bg-black"
      />

      <div className="flex flex-wrap gap-2">
        {!streamRef.current && !recordedBlob && (
          <button
            onClick={startCamera}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Attiva fotocamera
          </button>
        )}

        {streamRef.current && !recording && !recordedBlob && (
          <button
            onClick={startRecording}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Avvia registrazione
          </button>
        )}

        {recording && (
          <button
            onClick={stopRecording}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Ferma registrazione
          </button>
        )}

        {recordedBlob && (
          <button
            onClick={resetRecording}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
          >
            Registra di nuovo
          </button>
        )}
      </div>

      {recordedBlob && (
        <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <input
            type="text"
            placeholder="Titolo (facoltativo)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Chi può vederlo</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="private">Privato (solo io)</option>
              <option value="custode">Condiviso con il mio Custode</option>
              <option value="public">
                Pubblico (visibile agli abbonati, dopo moderazione)
              </option>
            </select>
          </div>

          <button
            onClick={upload}
            disabled={uploading}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {uploading ? "Caricamento..." : "Salva messaggio"}
          </button>
        </div>
      )}

      {status && <p className="text-sm">{status}</p>}
    </div>
  );
}
