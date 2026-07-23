"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import fixWebmDuration from "fix-webm-duration";
import { createClient } from "@/lib/supabase/client";
import ShareManager from "@/components/ShareManager";

type Visibility = "private" | "custode" | "public";

export default function Recorder({
  userId,
  subscriptionActive,
}: {
  userId: string;
  subscriptionActive: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number>(0);

  const [cameraReady, setCameraReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [canStop, setCanStop] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishedShareVideoId, setPublishedShareVideoId] = useState<string | null>(null);

  const MIN_RECORDING_MS = 1200;
  const MIN_BLOB_BYTES = 2000;

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function activateCamera() {
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
    setCameraReady(true);
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
    recorder.onstop = async () => {
      const rawBlob = new Blob(chunksRef.current, { type: "video/webm" });
      // Stop the camera/mic tracks only now: MediaRecorder.stop() is async,
      // stopping the tracks any earlier can cut off the final chunk of data.
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      if (rawBlob.size < MIN_BLOB_BYTES) {
        setStatus("Recording too short - please record for at least a couple of seconds and try again.");
        setCameraReady(false);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = "";
        }
        return;
      }

      // MediaRecorder webm files don't embed a duration, so players show
      // "0:00" even though the content is all there. Patch it in.
      const duration = Date.now() - recordingStartRef.current;
      const blob = await fixWebmDuration(rawBlob, duration, { logger: false });

      setRecordedBlob(blob);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.muted = false;
        videoRef.current.src = URL.createObjectURL(blob);
      }
    };
    mediaRecorderRef.current = recorder;
    // Request a data chunk every second: short clips are more likely to
    // produce at least one valid, non-empty chunk this way.
    recordingStartRef.current = Date.now();
    recorder.start(1000);
    setRecording(true);
    setCanStop(false);
    setTimeout(() => setCanStop(true), MIN_RECORDING_MS);
  }

  function stopRecording() {
    if (!canStop) return;
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setCameraReady(false);
  }

  function cancelRecording() {
    setRecordedBlob(null);
    setTitle("");
    setStatus(null);
    if (videoRef.current) {
      videoRef.current.src = "";
    }
  }

  async function publish() {
    if (!recordedBlob) return;
    setUploading(true);
    setStatus(null);
    setPublishedShareVideoId(null);

    const fileName = `${userId}/${crypto.randomUUID()}.webm`;

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(fileName, recordedBlob, { contentType: "video/webm" });

    if (uploadError) {
      setStatus(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("videos")
      .insert({
        user_id: userId,
        storage_path: fileName,
        title: title || null,
        visibility,
      })
      .select("id")
      .single();

    setUploading(false);

    if (insertError) {
      setStatus(`Could not save: ${insertError.message}`);
      return;
    }

    setStatus("Your message has been saved.");
    setRecordedBlob(null);
    setTitle("");
    if (visibility === "custode" && inserted) {
      setPublishedShareVideoId(inserted.id);
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <video
          ref={videoRef}
          controls={!!recordedBlob}
          playsInline
          className="aspect-video w-full bg-[#120f0a]"
        />
      </div>

      {!recordedBlob && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={activateCamera}
            disabled={cameraReady || recording}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:cursor-default disabled:opacity-50"
          >
            {cameraReady || recording ? "Camera on" : "Activate camera"}
          </button>

          {cameraReady && !recording && (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 rounded-full bg-danger px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90"
            >
              <span className="h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-white" />
              Play
            </button>
          )}

          {recording && (
            <button
              onClick={stopRecording}
              disabled={!canStop}
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm transition-colors hover:opacity-90 disabled:cursor-default disabled:opacity-50"
            >
              {canStop ? "Stop" : "Recording..."}
            </button>
          )}
        </div>
      )}

      {recordedBlob && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm font-medium text-foreground">
            Review your message
          </p>

          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="visibility" className="text-sm font-medium text-foreground">
              Who can see it
            </label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
            >
              <option value="private">Private (only me, free)</option>
              <option value="custode" disabled={!subscriptionActive}>
                Share With Your Loved Ones{!subscriptionActive ? " (subscription required)" : ""}
              </option>
              <option value="public" disabled={!subscriptionActive}>
                Shout It to the World{!subscriptionActive ? " (subscription required)" : ""}
              </option>
            </select>
            {!subscriptionActive && (
              <p className="text-xs text-muted">
                Sharing with loved ones or the world needs the{" "}
                <Link href="/subscribe" className="text-accent underline">
                  subscription
                </Link>
                .
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={publish}
              disabled={uploading}
              className="flex-1 rounded-full bg-accent py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {uploading ? "Publishing..." : "Publish"}
            </button>
            <button
              onClick={cancelRecording}
              disabled={uploading}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {status && <p className="text-sm text-muted">{status}</p>}

      {publishedShareVideoId && <ShareManager videoId={publishedShareVideoId} />}
    </div>
  );
}
