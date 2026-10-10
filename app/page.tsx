'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useRef, useId, useMemo, useEffect, useCallback } from "react";
import {
  GraduationCap,
  Upload,
  Search,
  FileText,
  User,
  Download,
  Eye,
  X,
  CheckCircle2,
  Mail,
  Lock,
  Sparkles,
  Shield,
  Clock,
  Send,
  FileCheck,
  AlertCircle,
  FlaskConical,
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Plus,
  Trash2,
  Check,
  MessageSquare,
  LogOut,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Görünüm Türleri
type ActiveView =
  | "departments"
  | "courses"
  | "course_detail"
  | "upload_note"
  | "admin_panel";

interface CourseItem {
  code: string;
  name: string;
  fullName: string;
  description: string;
  badgeClass: string;
}

interface NoteItem {
  id: number;
  course_code: string;
  student_name: string;
  title: string;
  file_url: string;
  file_name: string;
  file_size: string;
  file_type: "pdf" | "image" | string;
  is_approved: boolean;
  created_at: string;
}

interface ContactMessage {
  id: number;
  sender_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// Kimya Bölümü 4 Ders Verisi
const CHEMISTRY_COURSES: CourseItem[] = [
  {
    code: "KIM2511",
    name: "Analitik Kimya 1",
    fullName: "KIM2511 - Analitik Kimya 1",
    description:
      "Kantitatif ve kalitatif analiz prensipleri, çözelti dengeleri ve titrimetrik yöntemler.",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200/80",
  },
  {
    code: "KIM2521",
    name: "Anorganik Kimya 1",
    fullName: "KIM2521 - Anorganik Kimya 1",
    description:
      "Moleküler geometri, kimyasal bağ teorileri, simetri ve kristal alan teorisi.",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200/80",
  },
  {
    code: "KIM2531",
    name: "Fizikokimya 1",
    fullName: "KIM2531 - Fizikokimya 1",
    description:
      "Klasik termodinamik, kimyasal denge, durum denklemleri ve faz diyagramları.",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200/80",
  },
  {
    code: "KIM2541",
    name: "Analitik Kimya Laboratuvarı 1",
    fullName: "KIM2541 - Analitik Kimya Laboratuvarı 1",
    description:
      "Laboratuvar güvenlik kuralları, gravimetrik analiz ve asit-baz deney föyleri.",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200/80",
  },
];

// Tarih biçimlendirme yardımcısı
function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 2) return "Az önce";
    if (diffMinutes < 60) return `${diffMinutes} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays === 1) return "Dün";
    if (diffDays < 7) return `${diffDays} gün önce`;

    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Tarih belirtilmedi";
  }
}

export default function Home() {
  const fileInputId = useId();

  // Ekran Görünüm Durumu: "departments" -> "courses" -> "course_detail" -> "upload_note" | "admin_panel"
  const [currentView, setCurrentView] = useState<ActiveView>("departments");
  const [previousView, setPreviousView] = useState<ActiveView>("departments");
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);

  // Canlı Veriler (Supabase)
  const [courseNotes, setCourseNotes] = useState<NoteItem[]>([]);
  const [courseCounts, setCourseCounts] = useState<Record<string, number>>({});
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Admin Paneli Verileri
  const [adminNotes, setAdminNotes] = useState<NoteItem[]>([]);
  const [adminMessages, setAdminMessages] = useState<ContactMessage[]>([]);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState<"notes" | "messages">("notes");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Modallar
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [previewNote, setPreviewNote] = useState<NoteItem | null>(null);

  // Form State'leri (Not Ekleme Ekranı)
  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // İletişim Formu State'leri
  const [contactName, setContactName] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSending, setContactSending] = useState(false);

  // Admin Giriş Formu State
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Toast Bildirim State
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "info" | "warning";
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback(
    (text: string, type: "success" | "info" | "warning" = "success") => {
      setToastMessage({ text, type });
      setTimeout(() => {
        setToastMessage((prev) => (prev?.text === text ? null : prev));
      }, 4000);
    },
    []
  );

  // 1. Genel Ders Notu Sayılarını Canlı Çekme (Dersler ekranı için)
  const fetchCourseCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("course_code")
        .eq("is_approved", true);

      if (error) {
        console.error("Ders sayıları alınamadı:", error);
        return;
      }

      if (data) {
        const counts: Record<string, number> = {};
        for (const item of data) {
          counts[item.course_code] = (counts[item.course_code] || 0) + 1;
        }
        setCourseCounts(counts);
      }
    } catch (err) {
      console.error("fetchCourseCounts error:", err);
    }
  }, []);

  // 2. Seçili Derse Ait Canlı Notları Çekme (course_code ve is_approved = true)
  const fetchNotesForCourse = useCallback(
    async (courseCode: string) => {
      setIsLoadingNotes(true);
      try {
        const { data, error } = await supabase
          .from("notes")
          .select("*")
          .eq("course_code", courseCode)
          .eq("is_approved", true)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Notlar çekilirken hata:", error);
          showToast("Notlar yüklenirken bir hata oluştu.", "warning");
        } else if (data) {
          setCourseNotes(data as NoteItem[]);
        }
      } catch (err) {
        console.error("fetchNotesForCourse error:", err);
        showToast("Bağlantı hatası oluştu.", "warning");
      } finally {
        setIsLoadingNotes(false);
      }
    },
    [showToast]
  );

  // 3. Admin Paneli Notlarını Çekme
  const fetchAdminNotes = useCallback(async () => {
    setIsLoadingAdmin(true);
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Admin notları alınamadı:", error);
      } else if (data) {
        setAdminNotes(data as NoteItem[]);
      }
    } catch (err) {
      console.error("fetchAdminNotes error:", err);
    } finally {
      setIsLoadingAdmin(false);
    }
  }, []);

  // 4. Admin Paneli Mesajlarını Çekme
  const fetchAdminMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Mesajlar alınamadı:", error);
      } else if (data) {
        setAdminMessages(data as ContactMessage[]);
      }
    } catch (err) {
      console.error("fetchAdminMessages error:", err);
    }
  }, []);

  // İlk yüklemede ve ders seçiminde canlı verileri tazele
  useEffect(() => {
    let ignore = false;
    async function loadCounts() {
      try {
        const { data, error } = await supabase
          .from("notes")
          .select("course_code")
          .eq("is_approved", true);

        if (!ignore && !error && data) {
          const counts: Record<string, number> = {};
          for (const item of data) {
            counts[item.course_code] = (counts[item.course_code] || 0) + 1;
          }
          setCourseCounts(counts);
        }
      } catch (err) {
        console.error("loadCounts error:", err);
      }
    }
    loadCounts();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCourse || (currentView !== "course_detail" && currentView !== "upload_note")) {
      return;
    }

    const currentCourseCode = selectedCourse.code;
    let ignore = false;
    async function loadNotes() {
      setIsLoadingNotes(true);
      try {
        const { data, error } = await supabase
          .from("notes")
          .select("*")
          .eq("course_code", currentCourseCode)
          .eq("is_approved", true)
          .order("created_at", { ascending: false });

        if (!ignore) {
          if (error) {
            console.error("Notlar çekilirken hata:", error);
            showToast("Notlar yüklenirken bir hata oluştu.", "warning");
          } else if (data) {
            setCourseNotes(data as NoteItem[]);
          }
        }
      } catch (err) {
        console.error("loadNotes error:", err);
        if (!ignore) showToast("Bağlantı hatası oluştu.", "warning");
      } finally {
        if (!ignore) setIsLoadingNotes(false);
      }
    }

    loadNotes();
    return () => {
      ignore = true;
    };
  }, [selectedCourse, currentView, showToast]);

  // Navigasyon Fonksiyonları
  const handleSelectDepartment = () => {
    fetchCourseCounts();
    setCurrentView("courses");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectCourse = (course: CourseItem) => {
    setSelectedCourse(course);
    setSearchQuery("");
    fetchNotesForCourse(course.code);
    setCurrentView("course_detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenUpload = () => {
    setCurrentView("upload_note");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToDepartments = () => {
    setCurrentView("departments");
    setSelectedCourse(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToCourses = () => {
    fetchCourseCounts();
    setCurrentView("courses");
    setSelectedCourse(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToCourseDetail = () => {
    setCurrentView("course_detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Dosya Yükleme Sürükle-Bırak Yönetimi
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // ============================================================
  // NOT YÜKLEME (SUPABASE STORAGE + NOTES TABLOSU)
  // ============================================================
  const handleShareNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    if (!authorName.trim()) {
      showToast("Lütfen öğrenci adınızı ve soyadınızı giriniz.", "warning");
      return;
    }

    if (!title.trim()) {
      showToast("Lütfen not konusunu / başlığını belirtiniz.", "warning");
      return;
    }

    if (!selectedFile) {
      showToast("Lütfen paylaşılacak not dosyasını (PDF veya Resim) seçiniz.", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const isImg =
        selectedFile.type.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp)$/i.test(selectedFile.name);

      // Dosya adındaki parantez ve boşlukları temizleyen güvenli regex
      const cleanName = selectedFile.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      const filePath = `${Date.now()}_${cleanName}`;

      // 1. Supabase Storage 'course-notes' bucket'ına yükle
      const { error: uploadError } = await supabase.storage
        .from("course-notes")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        showToast(`Dosya yüklenemedi: ${uploadError.message}`, "warning");
        setIsSubmitting(false);
        return;
      }

      // 2. Bucket'tan dosyanın public URL'ini al
      const { data: urlData } = supabase.storage
        .from("course-notes")
        .getPublicUrl(filePath);

      const publicFileUrl = urlData.publicUrl;

      // 3. notes tablosuna kayıt ekle
      const fileSizeString = `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`;

      const { error: insertError } = await supabase
        .from("notes")
        .insert([
          {
            course_code: selectedCourse.code,
            student_name: authorName.trim(),
            title: title.trim(),
            file_url: publicFileUrl,
            file_name: selectedFile.name,
            file_size: fileSizeString,
            file_type: isImg ? "image" : "pdf",
            is_approved: true,
          },
        ]);

      if (insertError) {
        console.error("Note insert error:", insertError);
        showToast(`Not kaydedilirken hata oluştu: ${insertError.message}`, "warning");
        setIsSubmitting(false);
        return;
      }

      // 4. Formu temizle ve başarıyla ders not listesine yönlendir
      setAuthorName("");
      setTitle("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      showToast("Ders notunuz başarıyla yüklendi ve paylaşıldı! 🎉", "success");
      await fetchNotesForCourse(selectedCourse.code);
      fetchCourseCounts();
      setCurrentView("course_detail");
    } catch (err) {
      console.error("Upload error:", err);
      showToast("Beklenmeyen bir hata oluştu.", "warning");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // BİZE ULAŞIN (CONTACT_MESSAGES TABLOSUNA KAYDETME)
  // ============================================================
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactMessage.trim()) {
      showToast("Lütfen Ad Soyad ve Mesaj alanlarını doldurunuz.", "warning");
      return;
    }

    setContactSending(true);
    try {
      const { error } = await supabase.from("contact_messages").insert([
        {
          sender_name: contactName.trim(),
          message: contactMessage.trim(),
        },
      ]);

      if (error) {
        console.error("Contact message error:", error);
        showToast(`Mesaj iletilemedi: ${error.message}`, "warning");
      } else {
        setIsContactOpen(false);
        setContactName("");
        setContactMessage("");
        showToast(
          "Mesajınız iletildi! Moderatör ekibimiz en kısa sürede inceleyecektir.",
          "success"
        );
        fetchAdminMessages();
      }
    } catch (err) {
      console.error("Contact error:", err);
      showToast("Mesaj gönderilirken bağlantı hatası oluştu.", "warning");
    } finally {
      setContactSending(false);
    }
  };

  // ============================================================
  // ADMİN PANELİ & MODERASYON
  // ============================================================
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "admin123") {
      setIsAdminLoggedIn(true);
      setIsAdminLoginOpen(false);
      setAdminPassword("");
      setLoginError("");
      setPreviousView(currentView);
      fetchAdminNotes();
      fetchAdminMessages();
      setCurrentView("admin_panel");
      showToast("Yönetici girişi başarılı. Moderatör paneline hoş geldiniz!", "success");
    } else {
      setLoginError("Şifre hatalı! (Test şifresi: admin123)");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setCurrentView(previousView === "admin_panel" ? "departments" : previousView);
    showToast("Yönetici oturumu kapatıldı.", "info");
  };

  // Not Silme (HEM TABLODAN HEM STORAGE'DAN)
  const handleDeleteNote = async (note: NoteItem) => {
    if (!confirm(`"${note.title}" notunu ve dosyasını kalıcı olarak silmek istiyor musunuz?`)) {
      return;
    }

    try {
      // 1. Storage'dan dosyayı sil (file_url içindeki storage yolunu çıkararak)
      if (note.file_url) {
        try {
          const parts = note.file_url.split("/course-notes/");
          if (parts.length > 1) {
            const rawStoragePath = parts[1].split("?")[0];
            const decodedPath = decodeURIComponent(rawStoragePath);
            await supabase.storage.from("course-notes").remove([decodedPath]);
          }
        } catch (storageErr) {
          console.warn("Storage delete warning:", storageErr);
        }
      }

      // 2. notes tablosundan kaydı sil
      const { error: dbError } = await supabase
        .from("notes")
        .delete()
        .eq("id", note.id);

      if (dbError) {
        showToast(`Not tablodan silinemedi: ${dbError.message}`, "warning");
        return;
      }

      // 3. Arayüzü güncelle
      setAdminNotes((prev) => prev.filter((n) => n.id !== note.id));
      setCourseNotes((prev) => prev.filter((n) => n.id !== note.id));
      fetchCourseCounts();
      showToast(`"${note.title}" notu ve dosyası sistemden tamamen silindi.`, "success");
    } catch (err) {
      console.error("Delete note error:", err);
      showToast("Not silinirken hata oluştu.", "warning");
    }
  };

  // Not Onaylama / Onayı Kaldırma
  const handleToggleApproveNote = async (note: NoteItem) => {
    try {
      const newStatus = !note.is_approved;
      const { error } = await supabase
        .from("notes")
        .update({ is_approved: newStatus })
        .eq("id", note.id);

      if (error) {
        showToast(`Onay durumu güncellenemedi: ${error.message}`, "warning");
      } else {
        setAdminNotes((prev) =>
          prev.map((n) => (n.id === note.id ? { ...n, is_approved: newStatus } : n))
        );
        fetchCourseCounts();
        showToast(newStatus ? "Not onaylandı." : "Not onayı kaldırıldı.", "info");
      }
    } catch (err) {
      console.error("Toggle approve error:", err);
    }
  };

  // Mesaj Okundu İşaretleme
  const handleToggleReadMessage = async (msg: ContactMessage) => {
    try {
      const newRead = !msg.is_read;
      const { error } = await supabase
        .from("contact_messages")
        .update({ is_read: newRead })
        .eq("id", msg.id);

      if (!error) {
        setAdminMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, is_read: newRead } : m))
        );
      }
    } catch (err) {
      console.error("Toggle read message error:", err);
    }
  };

  // Mesaj Silme
  const handleDeleteMessage = async (msgId: number) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", msgId);

      if (!error) {
        setAdminMessages((prev) => prev.filter((m) => m.id !== msgId));
        showToast("Mesaj silindi.", "info");
      } else {
        showToast(`Mesaj silinemedi: ${error.message}`, "warning");
      }
    } catch (err) {
      console.error("Delete message error:", err);
    }
  };

  // Dosya İndirme (Blob Yöntemi ile Doğrudan Cihaza İndirme)
  const handleDownload = async (url: string, fileName: string) => {
    try {
      showToast(`"${fileName}" indiriliyor...`, "info");
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download error:", err);
      // Fallback
      window.open(url, "_blank");
    }
  };

  // Seçili derse ait filtrelenmiş notlar
  const filteredCourseNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return courseNotes;

    return courseNotes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.student_name.toLowerCase().includes(q)
    );
  }, [courseNotes, searchQuery]);

  // Okunmamış mesaj sayısı
  const unreadCount = useMemo(
    () => adminMessages.filter((m) => !m.is_read).length,
    [adminMessages]
  );

  // Toplam ders notu sayısı
  const totalApprovedNotes = useMemo(() => {
    return Object.values(courseCounts).reduce((a, b) => a + b, 0);
  }, [courseCounts]);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Bildirimi */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-top-3 duration-300">
          <div
            className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm backdrop-blur-md ${
              toastMessage.type === "success"
                ? "bg-emerald-50/95 border-emerald-300 text-emerald-900"
                : toastMessage.type === "warning"
                ? "bg-amber-50/95 border-amber-300 text-amber-900"
                : "bg-blue-50/95 border-blue-300 text-blue-900"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : toastMessage.type === "warning" ? (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            )}
            <p className="flex-1 font-medium leading-relaxed">
              {toastMessage.text}
            </p>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-700 transition"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sabit Üst Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo ve Başlık */}
          <button
            onClick={handleBackToDepartments}
            className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
            title="Ana Sayfaya Dön"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  YTÜ Not Havuzu
                </span>
                <span className="inline-flex px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                  FEF
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Fen Edebiyat Fakültesi Ders Notu Paylaşım Ağı
              </p>
            </div>
          </button>

          {/* Sağ Eylemler: Bize Ulaşın & Admin Butonu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsContactOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-blue-700 bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200 rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              <Mail className="w-4 h-4 text-slate-500" />
              <span>Bize Ulaşın</span>
            </button>

            {isAdminLoggedIn ? (
              <button
                onClick={() => {
                  fetchAdminNotes();
                  fetchAdminMessages();
                  setCurrentView("admin_panel");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Panel</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setLoginError("");
                  setIsAdminLoginOpen(true);
                }}
                title="Admin Girişi"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 rounded-lg transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Admin</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Ana İçerik Alanı */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* ============================================================
            GÖRÜNÜM 1: BÖLÜM SEÇİMİ
            ============================================================ */}
        {currentView === "departments" && (
          <section className="space-y-8 py-4 animate-in fade-in duration-300">
            {/* Karşılama Başlığı */}
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200/60">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Fen Edebiyat Fakültesi
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Bölüm Seçin
              </h1>
              <p className="text-sm text-slate-500">
                Ders notlarına ulaşmak ve yeni not paylaşmak için bölümünüzü seçin.
              </p>
            </div>

            {/* Bölüm Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto pt-2">
              {/* Aktif Seçenek: Kimya Bölümü */}
              <button
                type="button"
                onClick={handleSelectDepartment}
                className="group relative p-7 bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/10 transition-all text-left flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                      <FlaskConical className="w-7 h-7" />
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                      Aktif
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition">
                      Kimya Bölümü
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                      Analitik Kimya, Anorganik Kimya, Fizikokimya ve Laboratuvar ders notları.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">
                    4 Ders • {totalApprovedNotes} Paylaşılan Not
                  </span>
                  <span className="inline-flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                    Dersleri Gör
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </button>

              {/* Gelecek Bölümler */}
              <div className="p-7 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 flex flex-col justify-between opacity-70">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold bg-slate-200 text-slate-600 rounded-full">
                      Yakında
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-700">
                      Diğer FEF Bölümleri
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                      Matematik, Fizik, İstatistik, Moleküler Biyoloji ve Genetik bölümleri çok yakında eklenecek.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-200/60 text-xs text-slate-400 font-medium">
                  Geliştirilme aşamasında
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
            GÖRÜNÜM 2: DERS SEÇİMİ
            ============================================================ */}
        {currentView === "courses" && (
          <section className="space-y-6 animate-in fade-in duration-300">
            {/* Geri Butonu ve Başlık */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleBackToDepartments}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition cursor-pointer py-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Bölümlere Dön</span>
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Kimya Bölümü — Ders Seçin
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Notlarını incelemek veya not yüklemek istediğiniz dersi seçin.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    Toplam 4 Ders
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Ders Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {CHEMISTRY_COURSES.map((course) => {
                const count = courseCounts[course.code] || 0;

                return (
                  <button
                    key={course.code}
                    type="button"
                    onClick={() => handleSelectCourse(course)}
                    className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/10 transition-all text-left flex flex-col justify-between cursor-pointer"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-md border ${course.badgeClass}`}
                        >
                          {course.code}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {count} Not
                        </span>
                      </div>

                      <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {course.name}
                      </h2>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400">FEF Kimya</span>
                      <span className="inline-flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                        Notları Aç
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ============================================================
            GÖRÜNÜM 3: DERS SAYFASI (CANLI NOTLAR LİSTELENİR)
            ============================================================ */}
        {currentView === "course_detail" && selectedCourse && (
          <section className="space-y-6 animate-in fade-in duration-300">
            {/* Üst Bar: Geri Butonu & Ders Başlık Kutusu */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleBackToCourses}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition cursor-pointer py-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Derslere Dön</span>
              </button>

              {/* Ders Başlığı Üst Kutusu: Tek bir Plus ikonu ve 'Not Ekle' metni */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${selectedCourse.badgeClass}`}
                    >
                      {selectedCourse.code}
                    </span>
                    <span className="text-xs text-slate-500">Kimya Bölümü</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-medium text-slate-600">
                      {courseNotes.length} Not Mevcut
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {selectedCourse.fullName}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
                    {selectedCourse.description}
                  </p>
                </div>

                {/* Göze Çarpan Modern "Not Ekle" Butonu */}
                <div className="shrink-0 flex items-center">
                  <button
                    type="button"
                    onClick={handleOpenUpload}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Not Ekle</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sayfa Gövdesi: Not Listesi */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Paylaşılan Ders Notları
                  </h2>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                    {filteredCourseNotes.length}
                  </span>
                </div>

                {/* Arama Alanı */}
                <div className="w-full sm:w-64 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Bu derste ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Yükleniyor Durumu */}
              {isLoadingNotes ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-sm font-medium text-slate-600">
                    Ders notları yükleniyor...
                  </p>
                </div>
              ) : filteredCourseNotes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-800">
                      Henüz not paylaşılmamış
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                      {searchQuery
                        ? "Arama kriterinize uygun not bulunamadı."
                        : "Bu ders için ilk notu paylaşarak arkadaşlarına katkıda bulunabilirsin."}
                    </p>
                  </div>
                  <div>
                    {searchQuery ? (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                      >
                        Aramayı Temizle
                      </button>
                    ) : (
                      <button
                        onClick={handleOpenUpload}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Not Ekle</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCourseNotes.map((note) => (
                    <article
                      key={note.id}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between p-5 hover:border-slate-300 group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${selectedCourse.badgeClass}`}
                          >
                            {selectedCourse.code}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            {note.file_type.toUpperCase()}
                          </span>
                        </div>

                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                          {note.title}
                        </h3>

                        <div className="space-y-1.5 pt-1 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-medium text-slate-700">
                              {note.student_name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatDate(note.created_at)}</span>
                            </div>
                            <span>{note.file_size}</span>
                          </div>
                        </div>
                      </div>

                      {/* Aksiyonlar: Görüntüle ve İndir */}
                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                        <a
                          href={note.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Görüntüle</span>
                        </a>

                        <button
                          onClick={() => handleDownload(note.file_url, note.file_name)}
                          className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-2xs transition active:scale-95 cursor-pointer"
                          title="Notu İndir"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">İndir</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================
            GÖRÜNÜM 4: NOT EKLEME EKRANI (CANLI YÜKLEME)
            ============================================================ */}
        {currentView === "upload_note" && selectedCourse && (
          <section className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
            <div>
              <button
                type="button"
                onClick={handleBackToCourseDetail}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition cursor-pointer py-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Notlara Dön</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="space-y-2 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${selectedCourse.badgeClass}`}
                  >
                    {selectedCourse.fullName}
                  </span>
                  <span className="text-xs text-slate-400">Kimya Bölümü</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Bu Derse Not Ekle
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {selectedCourse.name} dersi için ders özeti, çıkmış vize/final
                  soruları veya çalışma notlarınızı yükleyin.
                </p>
              </div>

              <form onSubmit={handleShareNote} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Öğrenci Adı Soyadı <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Örn: Ahmet Yılmaz"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Not Başlığı / Açıklaması <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Örn: 3. Hafta Ders Özeti & Çıkmış Sorular"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Not Dosyası (PDF veya Resim) <span className="text-rose-500">*</span>
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                      isDragging
                        ? "border-blue-500 bg-blue-50/60"
                        : selectedFile
                        ? "border-emerald-300 bg-emerald-50/30"
                        : "border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      id={fileInputId}
                      type="file"
                      required
                      accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {selectedFile ? (
                      <div className="flex items-center justify-between max-w-md mx-auto p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                        <div className="flex items-center gap-3 overflow-hidden text-left">
                          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                            <FileCheck className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition"
                          title="Dosyayı kaldır"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 py-2">
                        <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-slate-700">
                          <span className="text-blue-600 font-semibold underline underline-offset-2">
                            Dosya seçin
                          </span>{" "}
                          veya buraya sürükleyin
                        </p>
                        <p className="text-xs text-slate-400">
                          PDF, PNG, JPG veya WEBP formatları desteklenir (Maks. 25 MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleBackToCourseDetail}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-sm shadow-blue-600/30 transition disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Buluta Yükleniyor...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Notu Paylaş</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* ============================================================
            GÖRÜNÜM 5: MODERATÖR PANELİ (CANLI SUPABASE)
            ============================================================ */}
        {currentView === "admin_panel" && (
          <section className="space-y-6 animate-in fade-in duration-300">
            {/* Admin Üst Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                      Moderatör Paneli
                    </h1>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                      Canlı Supabase
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    İçerik denetimi ve öğrenci iletişim yönetimi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAdminLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            </div>

            {/* Tab Seçimi: Not Moderasyonu vs Gelen Mesajlar */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setAdminTab("notes")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  adminTab === "notes"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Not Moderasyonu</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-700 text-white font-bold">
                  {adminNotes.length}
                </span>
              </button>

              <button
                onClick={() => setAdminTab("messages")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  adminTab === "messages"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Gelen Mesajlar</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-500 text-white font-bold">
                    {unreadCount} Yeni
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: NOT MODERASYONU (CANLI SİLME: VERİTABANI + STORAGE) */}
            {adminTab === "notes" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>Toplam {adminNotes.length} not kayıtlı</span>
                  <span>Sil butonu veritabanı ve Supabase Storage dosyasını siler</span>
                </div>

                {isLoadingAdmin ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                    <p className="text-xs text-slate-500">Notlar yükleniyor...</p>
                  </div>
                ) : adminNotes.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
                    Henüz veritabanında kayıtlı ders notu bulunmuyor.
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                    {adminNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition"
                      >
                        <div className="space-y-1.5 flex-1 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                              {note.course_code}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                note.is_approved
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {note.is_approved ? "Onaylı" : "Bekliyor"}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatDate(note.created_at)} • {note.file_size}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-slate-900">
                            {note.title}
                          </h3>

                          <p className="text-xs text-slate-500">
                            Yükleyen:{" "}
                            <strong className="text-slate-700">
                              {note.student_name}
                            </strong>{" "}
                            • Dosya: {note.file_name}
                          </p>
                        </div>

                        {/* Moderatör Aksiyon Butonları */}
                        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                          <button
                            onClick={() => setPreviewNote(note)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          >
                            İncele
                          </button>

                          <button
                            onClick={() => handleToggleApproveNote(note)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                              note.is_approved
                                ? "bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{note.is_approved ? "Onayı Kaldır" : "Onayla"}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteNote(note)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-lg transition cursor-pointer"
                            title="Veritabanı ve Storage'dan Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Sil</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: GELEN MESAJLAR (CANLI CONTACT_MESSAGES) */}
            {adminTab === "messages" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>Öğrencilerden gelen mesajlar ({adminMessages.length})</span>
                  <span>{unreadCount} okunmamış mesaj</span>
                </div>

                {adminMessages.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                    Henüz gelen bir mesaj bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adminMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-5 rounded-2xl border transition bg-white space-y-3 ${
                          msg.is_read
                            ? "border-slate-200 opacity-80"
                            : "border-blue-300 shadow-2xs bg-blue-50/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {msg.sender_name}
                              </span>
                              {!msg.is_read && (
                                <span className="px-2 py-0.2 text-[10px] font-bold bg-blue-100 text-blue-800 rounded">
                                  Yeni
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              {formatDate(msg.created_at)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleReadMessage(msg)}
                              className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                            >
                              {msg.is_read ? "Okunmadı Yap" : "Okundu Say"}
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Mesajı Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl text-xs sm:text-sm text-slate-700 leading-relaxed border border-slate-100">
                          {msg.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200 text-xs text-slate-500 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-800">YTÜ Not Havuzu</span>
            <span>•</span>
            <span>Kimya Bölümü</span>
          </div>
          <p>
            Bağımsız öğrenci inisiyatifidir. Notlar eğitim amaçlı paylaşılmaktadır.
          </p>
        </div>
      </footer>

      {/* ============================================================
          BİZE ULAŞIN MODALI (CANLI SUPABASE)
          ============================================================ */}
      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Bize Ulaşın
                  </h3>
                  <p className="text-xs text-slate-500">
                    Görüş, öneri veya not talepleriniz için
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsContactOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adınız ve Soyadınız <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Zeynep Demir"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mesajınız <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Mesajınızı veya talebinizi buraya yazabilirsiniz..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContactOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={contactSending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm disabled:opacity-70 cursor-pointer"
                >
                  {contactSending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Gönder</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          ADMİN GİRİŞİ MODALI
          ============================================================ */}
      {isAdminLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Moderatör Girişi
                  </h3>
                  <p className="text-xs text-slate-500">
                    İçerik onay ve moderatör paneli
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdminLoginOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yönetici Şifresi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    placeholder="Şifreyi giriniz (admin123)"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setLoginError("");
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
                {loginError && (
                  <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{loginError}</span>
                  </p>
                )}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Test girişi için şifre: <strong>admin123</strong>
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminLoginOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-sm cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Giriş Yap</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          NOT ÖNİZLEME MODALI
          ============================================================ */}
      {previewNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border bg-slate-100 text-slate-800 border-slate-200">
                  {previewNote.course_code}
                </span>
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {previewNote.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewNote(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Yükleyen:</span>
                  <strong className="text-slate-800">
                    {previewNote.student_name}
                  </strong>
                </div>
                <span className="text-slate-400">
                  {formatDate(previewNote.created_at)}
                </span>
              </div>

              <div className="p-4 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="truncate flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {previewNote.file_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    Boyut: {previewNote.file_size} • Format:{" "}
                    {previewNote.file_type.toUpperCase()}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500 italic text-center pt-1">
                Bu not Yıldız Teknik Üniversitesi Kimya Bölümü öğrencisi
                tarafından eğitim amaçlı paylaşılmıştır.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPreviewNote(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Kapat
              </button>
              <a
                href={previewNote.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-xl transition cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Görüntüle</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  handleDownload(previewNote.file_url, previewNote.file_name);
                  setPreviewNote(null);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>İndir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
