'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface Siswa {
  id: string;
  nis: string;
  nama: string;
  whatsappOrangTua: string;
}

type StatusKehadiran = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';

interface StudentAttendanceState {
  siswaId: string;
  status: StatusKehadiran;
  alasan?: string;
  buktiUrl?: string;
  buktiPreview?: string;
  uploadError?: string;
}

function AttendanceFormInner() {
  const searchParams = useSearchParams();
  const [tanggal, setTanggal] = useState<string>(searchParams.get('tanggal') || new Date().toISOString().split('T')[0]);
  const [kelas, setKelas] = useState<string>(searchParams.get('kelas') || 'XI-RPL-1');
  const [students, setStudents] = useState<Siswa[]>([]);
  const [attendance, setAttendance] = useState<Record<string, StudentAttendanceState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/absensi?kelas=${kelas}&tanggal=${tanggal}`);
        const data = await res.json();
        const studentList = data.students || [];
        setStudents(studentList);
        setIsSuccess(!!data.alreadySubmitted);
        
        const initialAttendance: Record<string, StudentAttendanceState> = {};
        studentList.forEach((s: any) => {
          initialAttendance[s.id] = {
            siswaId: s.id,
            status: s.status,
            alasan: s.alasan,
            buktiUrl: s.buktiUrl,
            buktiPreview: s.buktiUrl || '',
            uploadError: '',
          };
        });
        setAttendance(initialAttendance);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttendanceData();
  }, [kelas, tanggal]);

  const handleStatusChange = (siswaId: string, status: StatusKehadiran) => {
    setAttendance((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        status,
        ...(status === 'HADIR' || status === 'ALPA' 
          ? { alasan: '', buktiUrl: '', buktiPreview: '', uploadError: '' } 
          : {}),
      },
    }));
  };

  const handleAlasanChange = (siswaId: string, alasan: string) => {
    setAttendance((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        alasan,
      },
    }));
  };

  const handleFileUpload = (siswaId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      updateUploadError(siswaId, 'Format VIDEO dilarang! Harap unggah foto.');
      e.target.value = '';
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      updateUploadError(siswaId, 'Hanya gambar JPEG/PNG yang diperbolehkan.');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      updateUploadError(siswaId, 'Ukuran file maksimal 2MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: fd,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          updateUploadError(siswaId, uploadData.error || 'Upload gagal');
          return;
        }

        setAttendance((prev) => ({
          ...prev,
          [siswaId]: {
            ...prev[siswaId],
            buktiUrl: uploadData.url,
            buktiPreview: reader.result as string,
            uploadError: '',
          },
        }));
      } catch (err) {
        updateUploadError(siswaId, 'Gagal mengunggah file.');
      }
    };
    reader.readAsDataURL(file);
  };

  const updateUploadError = (siswaId: string, errorMsg: string) => {
    setAttendance((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        buktiUrl: '',
        buktiPreview: '',
        uploadError: errorMsg,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    let hasValidationError = false;
    const currentAttendance = { ...attendance };

    for (const student of students) {
      const state = currentAttendance[student.id];
      if (state.status === 'IZIN' || state.status === 'SAKIT') {
        if (!state.alasan?.trim()) {
          state.uploadError = 'Alasan ketidakhadiran wajib diisi!';
          hasValidationError = true;
        }
        if (!state.buktiUrl) {
          state.uploadError = state.uploadError 
            ? `${state.uploadError} Dan foto bukti wajib diunggah!`
            : 'Foto bukti fisik wajib diunggah!';
          hasValidationError = true;
        }
      }
    }

    if (hasValidationError) {
      setAttendance(currentAttendance);
      setSubmitMessage({
        type: 'error',
        text: 'Gagal menyimpan absensi. Silakan lengkapi alasan dan bukti untuk siswa yang Izin/Sakit.',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        tanggal,
        data: Object.values(attendance).map((item) => ({
          siswaId: item.siswaId,
          status: item.status,
          alasan: item.alasan,
          buktiUrl: item.buktiUrl,
        })),
      };

      const res = await fetch('/api/admin/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsSuccess(true);
      } else {
        const resData = await res.json();
        setSubmitMessage({
          type: 'error',
          text: resData.error || 'Gagal menyimpan absensi.',
        });
      }
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: 'Terjadi kesalahan internal server.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDetailForm = (siswaId: string, state: StudentAttendanceState) => {
    if (state.status !== 'IZIN' && state.status !== 'SAKIT') return null;

    return (
      <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2 mt-2">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Alasan Ketidakhadiran *</label>
          <input
            type="text"
            value={state.alasan || ''}
            onChange={(e) => handleAlasanChange(siswaId, e.target.value)}
            placeholder="Tulis alasan singkat..."
            className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Unggah Bukti Foto (PNG/JPG, Maks. 2MB) *
          </label>
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={(e) => handleFileUpload(siswaId, e)}
            className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
          />
          {state.uploadError && (
            <p className="text-[11px] font-medium text-rose-600 mt-1">{state.uploadError}</p>
          )}
        </div>

        {state.buktiPreview && (
          <div className="relative w-20 h-20 border border-slate-200 rounded-lg overflow-hidden mt-1 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.buktiPreview} alt="Bukti upload preview" className="object-cover w-full h-full" />
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-xl border border-slate-100 text-center py-20 text-slate-400 font-semibold">
        Memuat data absensi...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-xl border border-slate-100">
      <div className="border-b border-slate-100 pb-5 mb-6">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Form Absensi Harian Kelas</h2>
        <p className="text-slate-500 text-sm">Catat kehadiran siswa secara akurat setelah kelas selesai.</p>
      </div>

      {/* Date & Class Selectors (Always Visible) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl mb-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Tanggal Absensi</label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Kelas</label>
          <select
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
          >
            <option value="XI-RPL-1">XI RPL 1</option>
            <option value="XI-RPL-2">XI RPL 2</option>
            <option value="XII-RPL-1">XII RPL 1</option>
          </select>
        </div>
      </div>

      {isSuccess ? (
        <div className="max-w-2xl mx-auto mt-6 p-8 md:p-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-center relative overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-b from-emerald-50 to-transparent -z-10" />
          
          <div className="w-20 h-20 bg-gradient-to-tr from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200/50 ring-8 ring-emerald-50">
            <svg className="w-10 h-10 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
            Rekap kehadiran hari ini sudah dikirim
          </h2>
          <p className="text-slate-500 text-base mb-8 font-medium">
            Data absensi kelas <span className="text-slate-800 font-semibold">{kelas}</span> pada tanggal <span className="text-slate-800 font-semibold">{tanggal}</span> telah tersimpan di sistem.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSuccess(false)}
              className="w-full sm:w-auto px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all shadow-sm outline-none"
            >
              Kembali Edit
            </button>
            <a
              href="/rekap"
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-100 hover:shadow-indigo-200 outline-none block"
            >
              Lihat Rekap
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitMessage && (
            <div className={`p-4 rounded-xl text-sm ${
              submitMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {submitMessage.text}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Daftar Kehadiran Siswa</h3>
            
            {students.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-semibold">Belum ada data siswa di kelas ini.</div>
            ) : (
              <>
                <div className="hidden md:block overflow-hidden border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="p-3 text-xs font-bold text-slate-700 uppercase tracking-wider w-1/12 text-center">NIS</th>
                        <th className="p-3 text-xs font-bold text-slate-700 uppercase tracking-wider w-3/12">Nama Siswa</th>
                        <th className="p-3 text-xs font-bold text-slate-700 uppercase tracking-wider w-4/12 text-center">Opsi Kehadiran</th>
                        <th className="p-3 text-xs font-bold text-slate-700 uppercase tracking-wider w-4/12">Keterangan Izin/Sakit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((siswa) => {
                        const state = attendance[siswa.id] || { status: 'HADIR' };
                        return (
                          <tr key={siswa.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-sm text-slate-600 text-center font-mono">{siswa.nis}</td>
                            <td className="p-3">
                              <p className="font-semibold text-slate-800 text-sm">{siswa.nama}</p>
                              <p className="text-slate-400 text-xs">WA Wali: {siswa.whatsappOrangTua}</p>
                            </td>
                            <td className="p-3">
                              <div className="flex justify-center gap-1.5">
                                {([
                                  { label: 'Hadir', val: 'HADIR', activeClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-200', baseClass: 'hover:bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300' },
                                  { label: 'Izin', val: 'IZIN', activeClass: 'bg-amber-500 text-white shadow-md shadow-amber-200', baseClass: 'hover:bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300' },
                                  { label: 'Sakit', val: 'SAKIT', activeClass: 'bg-sky-500 text-white shadow-md shadow-sky-200', baseClass: 'hover:bg-sky-50 text-sky-700 border-sky-200 hover:border-sky-300' },
                                  { label: 'Alpa', val: 'ALPA', activeClass: 'bg-rose-600 text-white shadow-md shadow-rose-200', baseClass: 'hover:bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300' }
                                ] as const).map((btn) => (
                                  <button
                                    key={btn.val}
                                    type="button"
                                    onClick={() => handleStatusChange(siswa.id, btn.val)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                      state.status === btn.val ? btn.activeClass : `bg-white ${btn.baseClass}`
                                    }`}
                                  >
                                    {btn.label}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="p-3">
                              {renderDetailForm(siswa.id, state)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-4">
                  {students.map((siswa) => {
                    const state = attendance[siswa.id] || { status: 'HADIR' };
                    return (
                      <div key={siswa.id} className="p-4 border border-slate-150 rounded-xl space-y-3 bg-white hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{siswa.nama}</p>
                            <p className="text-slate-400 text-xs">NIS: {siswa.nis} | WA: {siswa.whatsappOrangTua}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-1">
                          {([
                            { label: 'Hadir', val: 'HADIR', activeClass: 'bg-emerald-600 text-white', baseClass: 'text-emerald-700 border-emerald-100 bg-emerald-50/30' },
                            { label: 'Izin', val: 'IZIN', activeClass: 'bg-amber-500 text-white', baseClass: 'text-amber-700 border-amber-100 bg-amber-50/30' },
                            { label: 'Sakit', val: 'SAKIT', activeClass: 'bg-sky-500 text-white', baseClass: 'text-sky-700 border-sky-100 bg-sky-50/30' },
                            { label: 'Alpa', val: 'ALPA', activeClass: 'bg-rose-600 text-white', baseClass: 'text-rose-700 border-rose-100 bg-rose-50/30' }
                          ] as const).map((btn) => (
                            <button
                              key={btn.val}
                              type="button"
                              onClick={() => handleStatusChange(siswa.id, btn.val)}
                              className={`py-2 text-center text-xs font-semibold rounded-lg border transition-all ${
                                state.status === btn.val ? btn.activeClass : `bg-white ${btn.baseClass}`
                              }`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>

                        {renderDetailForm(siswa.id, state)}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className={`px-6 py-3 text-sm font-semibold text-white rounded-xl shadow-lg transition-all ${
                isSubmitting || isLoading
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-150 active:scale-95'
              }`}
            >
              {isSubmitting ? 'Menyimpan Absensi...' : 'Simpan & Kirim Absensi'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function AttendanceForm() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto p-10 text-center text-slate-500 font-medium">Memuat form...</div>}>
      <AttendanceFormInner />
    </Suspense>
  );
}
