import React, { useState, useRef } from "react";
import { CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";

const InterviewSession = () => {
  const location    = useLocation();
  const navigate    = useNavigate();
  const initialData = location.state;

  if (!initialData?.question || !initialData?.session_id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5"
        style={{ background: "#04040a", fontFamily: "'DM Sans', sans-serif" }}>
        <p className="text-white/40 text-sm">No interview configured.</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#00D1FF,#7B3FF2)", boxShadow: "0 4px 20px rgba(0,209,255,0.25)" }}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  const [question, setQuestion]                   = useState(initialData?.question);
  const [questionNumber, setQuestionNumber]        = useState(1);
  const [totalQuestions]                           = useState(initialData?.total_questions);
  const [isSubmitting, setIsSubmitting]            = useState(false);
  const [answer, setAnswer]                        = useState("");
  const [isAnswerSubmitted, setIsAnswerSubmitted]  = useState(false);
  const [isRecording, setIsRecording]              = useState(false);
  const [audioBlob, setAudioBlob]                  = useState(null);
  const [feedback, setFeedback]                    = useState(null);
  const [micReady, setMicReady]                    = useState(false);
  const [recordingStatus, setRecordingStatus]      = useState("idle");
  const mediaRecorderRef = useRef(null);
  const streamRef        = useRef(null);
  const sessionId  = initialData?.session_id ?? localStorage.getItem("session_id");
  const mode       = initialData?.mode ?? "practice";

  React.useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        setMicReady(true);
      })
      .catch(() => setMicReady(false));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleSubmitAnswer = async () => {
    if (!audioBlob && !answer.trim()) { alert("Please provide an answer."); return; }
    const formData = new FormData();
    formData.append("session_id", sessionId);
    if (audioBlob) formData.append("audio_file", audioBlob);
    else           formData.append("text_answer", answer);

    try {
      setIsSubmitting(true);
      const res  = await axios.post(
        "http://127.0.0.1:8000/interview/answer",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const data = res.data;
      setFeedback(data);
      if (data.transcribed_text) setAnswer(data.transcribed_text);
      setIsAnswerSubmitted(true);
      setAudioBlob(null);

      if (data.next_question?.completed) {
        try {
          await axios.get(`http://127.0.0.1:8000/interview/summary/${sessionId}`);
        } catch (e) {
          console.warn("Summary save failed:", e);
        }
        setTimeout(() => {
          if (mode === "interview") {
            navigate(`/report/${sessionId}`);
          } else {
            navigate(`/summary/${sessionId}`);
          }
        }, 800);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong submitting your answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (!feedback?.next_question) return;
    setQuestion(feedback.next_question.question);
    setQuestionNumber(p => p + 1);
    setAnswer(""); setAudioBlob(null); setFeedback(null); setIsAnswerSubmitted(false);
  };

 const startRecording = async () => {

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    streamRef.current = stream;

    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorderRef.current = mediaRecorder;

    let chunks = [];

    mediaRecorder.ondataavailable = async (event) => {

  const formData = new FormData();
  formData.append("audio", event.data);

  try {

    const response = await fetch(
      "http://localhost:8000/asr/live-transcribe",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    if (data.text) {
      setAnswer(prev => prev + " " + data.text);
    }

  } catch (err) {
    console.error("Transcription error:", err);
  }
};

    mediaRecorder.start(2000); // send every 2 seconds

    setIsRecording(true);
  };

  const stopRecording = () => {

    mediaRecorderRef.current.stop();

    streamRef.current.getTracks().forEach(track => track.stop());

    setIsRecording(false);

  };

  // Real-time speech recognition
// const recognitionRef = useRef(null);
// const [liveText, setLiveText] = useState("");

const startLiveTranscription = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return; // not supported

  const recognition = new SpeechRecognition();
  recognition.continuous = true;       // keep listening
  recognition.interimResults = true;   // show partial results
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    let interim = "";
    let final = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript;
      } else {
        interim += transcript;
      }
    }

    // Show live text (final + what's being spoken right now)
    setLiveText(final + interim);
  };

  recognition.onerror = (e) => console.error("Speech error:", e);
  recognitionRef.current = recognition;
  recognition.start();
};

const stopLiveTranscription = () => {
  recognitionRef.current?.stop();
  setLiveText("");
};

  const total = totalQuestions || 5;

  return (
    <div className="h-screen overflow-hidden relative" style={{ background: "#04040a", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Background orbs */}
      <div className="absolute rounded-full pointer-events-none" style={{ width: 500, height: 500, background: "rgba(123,63,242,0.13)", top: -80, right: -80, filter: "blur(100px)" }} />
      <div className="absolute rounded-full pointer-events-none" style={{ width: 380, height: 380, background: "rgba(0,209,255,0.09)", bottom: -60, left: -60, filter: "blur(90px)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />

      <style>{`
        @keyframes micPulse {
          0%   { transform: scale(1);    opacity: 0.7; }
          70%  { transform: scale(1.08); opacity: 0;   }
          100% { transform: scale(1.08); opacity: 0;   }
        }
        @keyframes waveBar {
          0%, 100% { transform: scaleY(1);   }
          50%       { transform: scaleY(1.9); }
        }
        .right-scroll::-webkit-scrollbar { display: none; }
        .right-scroll { scrollbar-width: none; }
        .mic-btn { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, filter 0.25s ease !important; }
        .mic-btn:hover:not(:disabled) { transform: scale(1.15); filter: brightness(1.2); }
        .mic-btn:active:not(:disabled) { transform: scale(0.95); }
      `}</style>

      <Navbar />

      {/* ── Full-width header: progress + question counter ── */}
      <div className="relative z-10 px-8 pb-0" style={{ paddingTop: 74 }}>
        <div className="flex items-center gap-3">
          {/* Step dots */}
          <div className="flex items-center gap-2 flex-1">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className="relative flex-1 flex items-center">
                <div
                  className="w-full h-[3px] rounded-full transition-all duration-500"
                  style={{
                    background: i < questionNumber
                      ? "linear-gradient(90deg, #00D1FF, #7B3FF2)"
                      : "rgba(255,255,255,0.07)",
                    boxShadow: i < questionNumber ? "0 0 8px rgba(0,209,255,0.4)" : "none",
                  }}
                />
              </div>
            ))}
          </div>
          {/* Counter badge */}
          <span
            className="shrink-0 text-[11px] font-semibold px-3 py-1 rounded-full"
            style={{
              background: "rgba(0,209,255,0.08)",
              border: "1px solid rgba(0,209,255,0.2)",
              color: "#00D1FF",
              letterSpacing: "0.04em",
            }}>
            {questionNumber} / {total}
          </span>
        </div>
      </div>

      {/* ── Split panels ── */}
      <div
        className="relative z-10 flex"
        style={{ height: "calc(100vh - 62px - 54px)", marginTop: 14 }}
      >

        {/* ══ LEFT PANEL ══ */}
        <div className="flex flex-col w-1/2 px-8 py-2 min-w-0">

          {/* Panel label */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 mb-3">Question</p>

          {/* Question card — fills remaining height */}
          <div
            className="flex flex-col flex-1 rounded-2xl p-7 min-h-0"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(24px)",
            }}
          >
            {/* Question number chip + text */}
            <div className="mb-6 shrink-0">
              <span
                className="inline-block px-3 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest mb-4"
                style={{ background: "rgba(123,63,242,0.15)", border: "1px solid rgba(123,63,242,0.35)", color: "#9B6BFF" }}>
                Question {questionNumber}
              </span>
              <h2
                className="text-[22px] font-bold leading-[1.45]"
                style={{ fontFamily: "'Syne', sans-serif", color: "rgba(255,255,255,0.92)" }}>
                {question}
              </h2>
            </div>

            {/* Mic section */}
            {!isAnswerSubmitted && (
              <div className="flex flex-col items-center gap-3 my-auto shrink-0">
                <div className="relative flex items-center justify-center" style={{ width: 130, height: 130 }}>
                  {(isRecording || recordingStatus === "starting") && [1, 2, 3].map(n => (
                    <div key={n} className="absolute rounded-full"
                      style={{
                        width: 52 + n * 22, height: 52 + n * 22,
                        border: `1px solid ${isRecording ? "#00D1FF" : "rgba(0,209,255,0.3)"}`,
                        opacity: isRecording ? 1 : 0,
                        animation: isRecording ? `micPulse 1.8s ease-out infinite` : "none",
                        animationDelay: `${n * 0.45}s`,
                        transition: "opacity 0.4s ease",
                      }} />
                  ))}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isSubmitting}
                    className="relative z-10 rounded-full flex items-center justify-center mic-btn cursor-pointer transition duration-250 ease-in-out hover:scale-90"
                    style={{
                      width: 66, height: 66,
                      background: isRecording
                        ? "linear-gradient(135deg, #FF2FB3, #7B3FF2)"
                        : recordingStatus === "starting"
                          ? "linear-gradient(135deg, rgba(255,47,179,0.3), rgba(123,63,242,0.5))"
                          : "linear-gradient(135deg, rgba(0,209,255,0.18), rgba(123,63,242,0.28))",
                      border: `2px solid ${isRecording ? "rgba(255,47,179,0.7)" : "rgba(0,209,255,0.55)"}`,
                      boxShadow: isRecording ? "0 0 36px rgba(255,47,179,0.5)" : "0 0 22px rgba(0,209,255,0.3)",
                      // transition: "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
                    }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                      <rect x="9" y="2" width="6" height="11" rx="3" fill={isRecording ? "#fff" : "#00D1FF"} />
                      <path d="M5 10a7 7 0 0014 0" stroke={isRecording ? "#fff" : "#00D1FF"} strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="12" y1="17" x2="12" y2="21" stroke={isRecording ? "#fff" : "#00D1FF"} strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="9" y1="21" x2="15" y2="21" stroke={isRecording ? "#fff" : "#00D1FF"} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                {/* Add this below your mic button */}
{/* {liveText && (
  <div style={{
    marginTop: 16,
    padding: "12px 16px",
    background: "rgba(0,209,255,0.06)",
    border: "1px solid rgba(0,209,255,0.2)",
    borderRadius: 12,
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    lineHeight: 1.6,
    fontFamily: "'DM Sans', sans-serif",
    minHeight: 60,
    transition: "all 0.2s"
  }}>
    <span style={{ color: "#00D1FF", fontSize: 11, display: "block", marginBottom: 6 }}>
      🎙 Live transcript
    </span>
    {liveText}
    <span style={{
      display: "inline-block",
      width: 8, height: 8,
      borderRadius: "50%",
      background: "#00D1FF",
      marginLeft: 4,
      animation: "pulse 1s infinite"
    }} />
  </div>
)} */}

                {isRecording && (
                  <div className="flex items-center gap-0.5" style={{ height: 28 }}>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} className="rounded-sm"
                        style={{ width: 3, background: "linear-gradient(to top, #00D1FF, #7B3FF2)", height: `${14 + Math.sin(i * 0.9) * 10}px`, animation: "waveBar 0.6s ease-in-out infinite", animationDelay: `${(i * 0.07).toFixed(2)}s` }} />
                    ))}
                  </div>
                )}

                <div
                  className="px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-500"
                  style={{
                    background: isRecording ? "rgba(255,47,179,0.1)" : audioBlob ? "rgba(0,209,255,0.1)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isRecording ? "rgba(255,47,179,0.35)" : audioBlob ? "rgba(0,209,255,0.3)" : "rgba(255,255,255,0.08)"}`,
                    color: isRecording ? "#FF2FB3" : audioBlob ? "#00D1FF" : "rgba(255,255,255,0.35)",
                  }}>
                  {recordingStatus === "starting" ? "⏳ Starting..." :
                   isRecording                    ? "🔴 Click to stop" :
                   recordingStatus === "stopping" ? "⏳ Saving..." :
                   audioBlob                      ? "✓ Recording saved" :
                                                    "Click mic to start"}
                </div>
              </div>
            )}

            {/* Submitted state — show mic icon muted */}
            {isAnswerSubmitted && (
              <div className="flex flex-col items-center justify-center my-auto gap-3 opacity-30">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="2" width="6" height="11" rx="3" fill="#fff" />
                  <path d="M5 10a7 7 0 0014 0" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="12" y1="17" x2="12" y2="21" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="9" y1="21" x2="15" y2="21" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p className="text-xs text-white/40">Answer submitted</p>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Eval criteria chips */}
            {!isAnswerSubmitted && (
              <div className="shrink-0 mb-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/20 mb-2">Scored on</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Relevance", color: "#00D1FF" },
                    { label: "Clarity",   color: "#7B3FF2" },
                    { label: "Confidence",color: "#FF2FB3" },
                    { label: "Filler Words", color: "#FFB800" },
                  ].map(c => (
                    <span key={c.label}
                      className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md"
                      style={{ background: `${c.color}10`, border: `1px solid ${c.color}28`, color: `${c.color}bb` }}>
                      {c.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            {!isAnswerSubmitted ? (
              <div className="flex gap-2.5 shrink-0">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: isRecording ? "rgba(255,47,179,0.1)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isRecording ? "rgba(255,47,179,0.35)" : "rgba(255,255,255,0.1)"}`,
                    color: isRecording ? "#FF2FB3" : "rgba(255,255,255,0.65)",
                  }}>
                  {isRecording ? "⏹ Stop" : "🎙 Record"}
                </button>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={isSubmitting || (!answer.trim() && !audioBlob)}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #00D1FF, #7B3FF2)", boxShadow: "0 4px 20px rgba(0,209,255,0.22)" }}>
                  {isSubmitting
                    ? <><div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /><span>Analyzing…</span></>
                    : "✓ Submit Answer"}
                </button>
              </div>
            ) : (
              <div className="flex justify-stretch shrink-0">
                <button
                  onClick={handleNextQuestion}
                  disabled={!feedback?.next_question || feedback?.next_question?.completed}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #00D1FF, #7B3FF2)", boxShadow: "0 4px 20px rgba(0,209,255,0.22)" }}>
                  {feedback?.next_question?.completed ? "Finishing…" : "Next Question →"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ══ GLOWING DIVIDER ══ */}
        <div className="relative shrink-0 flex items-stretch" style={{ width: 1 }}>
          <div className="w-px flex-1" style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(0,209,255,0.25) 20%, rgba(123,63,242,0.35) 50%, rgba(0,209,255,0.25) 80%, transparent 100%)" }} />
          {/* centre glow dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
            style={{ background: "#00D1FF", boxShadow: "0 0 12px 4px rgba(0,209,255,0.5)" }} />
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="flex flex-col w-1/2 px-8 py-2 min-w-0 right-scroll overflow-y-auto">

          {/* Panel label */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 mb-3 shrink-0">Your Answer</p>

          {/* Answer card */}
          <div
            className="rounded-2xl p-6 mb-4 shrink-0"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(24px)",
            }}
          >
            <textarea
              rows={9}
              value={answer}
              onChange={e => !isAnswerSubmitted && setAnswer(e.target.value)}
              readOnly={isAnswerSubmitted}
              placeholder="Speak your answer or type it here…"
              className="w-full px-4 py-3 rounded-xl text-sm text-white leading-relaxed outline-none resize-none transition-all duration-200"
              style={{
                background: isAnswerSubmitted ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${isAnswerSubmitted ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.09)"}`,
                fontFamily: "'DM Sans', sans-serif",
                cursor: isAnswerSubmitted ? "default" : "text",
                color: isAnswerSubmitted ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.9)",
              }}
              onFocus={e => { if (!isAnswerSubmitted) { e.target.style.borderColor = "rgba(0,209,255,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,209,255,0.08)"; }}}
              onBlur={e  => { e.target.style.borderColor = isAnswerSubmitted ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.09)"; e.target.style.boxShadow = "none"; }}
            />

            {/* Character hint */}
            {!isAnswerSubmitted && (
              <p className="text-[10px] text-white/20 mt-2 text-right">{answer.length} chars</p>
            )}
          </div>

          {/* ── Evaluation: practice mode ── */}
          {feedback && isAnswerSubmitted && mode === "practice" && (
            <div
              className="rounded-2xl p-6 shrink-0"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(24px)",
              }}
            >
              <h3 className="flex items-center gap-2 text-base font-bold mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>
                <TrendingUp size={16} color="#00D1FF" /> Evaluation
              </h3>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Relevance",   value: Math.round((feedback.score || 0) * 100),      unit: "%", color: "#00D1FF" },
                  { label: "Confidence",  value: Math.round((feedback.confidence || 0) * 100), unit: "%", color: "#7B3FF2", sublabel: feedback.confidence_label ?? null },
                  { label: "Filler Words",value: feedback.filler_words ?? 0,                   unit: "",  color: "#FFB800" },
                ].map((m, i) => (
                  <div key={i} className="rounded-xl p-4 text-center"
                    style={{ background: `${m.color}08`, border: `1px solid ${m.color}20` }}>
                    <p className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: m.color }}>{m.label}</p>
                    <p className="font-extrabold text-2xl" style={{ fontFamily: "'Syne', sans-serif", color: m.color }}>
                      {m.value}<span className="text-xs font-normal opacity-50">{m.unit}</span>
                    </p>
                    {m.unit === "%" && (
                      <div className="mt-2 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.value}%`, background: m.color, boxShadow: `0 0 6px ${m.color}55` }} />
                      </div>
                    )}
                    {m.sublabel && <p className="text-[9px] mt-1.5 font-semibold" style={{ color: `${m.color}bb` }}>{m.sublabel}</p>}
                    {m.unit === "" && <p className="text-[9px] mt-1.5" style={{ color: `${m.color}88` }}>{m.value === 0 ? "Clean!" : m.value <= 3 ? "Ok" : "Reduce"}</p>}
                  </div>
                ))}
              </div>

              {feedback.insight && (
                <div className="flex items-start gap-3 p-4 rounded-xl mb-4"
                  style={{ background: "rgba(0,209,255,0.04)", border: "1px solid rgba(0,209,255,0.18)" }}>
                  <CheckCircle size={15} color="#00D1FF" className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold mb-1 text-white/80">AI Feedback</p>
                    <p className="text-xs text-white/50 leading-relaxed">{feedback.insight}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                {(feedback.score || 0) >= 0.7 ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(0,209,255,0.1)", border: "1px solid rgba(0,209,255,0.3)", color: "#00D1FF" }}>
                    <CheckCircle size={11} /> Great answer!
                  </span>
                ) : (feedback.score || 0) >= 0.4 ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,184,0,0.1)", border: "1px solid rgba(255,184,0,0.3)", color: "#FFB800" }}>
                    <AlertCircle size={11} /> Could be stronger
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,47,179,0.1)", border: "1px solid rgba(255,47,179,0.3)", color: "#FF2FB3" }}>
                    <AlertCircle size={11} /> Needs improvement
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Interview mode — suspense */}
          {feedback && isAnswerSubmitted && mode === "interview" && !feedback?.next_question?.completed && (
            <div className="rounded-2xl p-5 text-center shrink-0"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs text-white/35">Answer recorded. Scores revealed at the end.</p>
            </div>
          )}

          {/* Submitting spinner */}
          {isSubmitting && (
            <div className="flex items-center gap-3 mt-4 px-2">
              <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-[#00D1FF] animate-spin shrink-0" />
              <p className="text-xs text-white/35">Analyzing your answer…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;