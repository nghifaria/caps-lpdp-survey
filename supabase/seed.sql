do $$
declare
  survey_id uuid;
  q_name_id uuid;
  q_univ_id uuid;
  q_prov_id uuid;
  q_jenjang_id uuid;
  q_lokasi_id uuid;
  q_eval1_id uuid;
  q_eval2_id uuid;
  q_eval3_id uuid;
  resp_id uuid;
begin
  -- 1. Clean up old test data in correct dependency order
  delete from public.answers;
  delete from public.responses;
  delete from public.questions;
  delete from public.surveys;

  -- 2. Insert main survey
  insert into public.surveys (title, is_active)
  values ('Survei Kepuasan Layanan LPDP 2026', true)
  returning id into survey_id;

  -- 3. Insert demographic questions
  insert into public.questions (survey_id, question_text, question_type, options, is_required)
  values (survey_id, 'Nama Lengkap', 'short_text', null, true)
  returning id into q_name_id;

  insert into public.questions (survey_id, question_text, question_type, options, is_required)
  values (survey_id, 'Perguruan Tinggi', 'short_text', null, true)
  returning id into q_univ_id;

  insert into public.questions (survey_id, question_text, question_type, options, is_required)
  values (survey_id, 'Asal Provinsi', 'dropdown', '["Jakarta","Jawa Barat","Jawa Tengah","Jawa Timur"]'::jsonb, true)
  returning id into q_prov_id;

  insert into public.questions (survey_id, question_text, question_type, options, is_required)
  values (survey_id, 'Jenjang Studi', 'dropdown', '["Magister","Doktor"]'::jsonb, true)
  returning id into q_jenjang_id;

  insert into public.questions (survey_id, question_text, question_type, options, is_required)
  values (survey_id, 'Lokasi Studi', 'dropdown', '["Dalam Negeri","Luar Negeri"]'::jsonb, true)
  returning id into q_lokasi_id;

  -- 4. Insert core evaluation questions (dual_likert)
  insert into public.questions (survey_id, question_text, question_type, options, is_required)
  values (survey_id, 'Kepuasan Layanan Pencarian Dana', 'dual_likert', null, true)
  returning id into q_eval1_id;

  insert into public.questions (survey_id, question_text, question_type, options, is_required)
  values (survey_id, 'Kepuasan Layanan Monitoring & Evaluasi', 'dual_likert', null, true)
  returning id into q_eval2_id;

  insert into public.questions (survey_id, question_text, question_type, options, is_required)
  values (survey_id, 'Kepuasan Sistem Akademik', 'dual_likert', null, true)
  returning id into q_eval3_id;


  -- 5. SIMULATE CRITICAL FEEDBACK PACKAGES (4 detailed tickets)

  -- Ticket 1: Ahmad Fauzi
  insert into public.responses (survey_id, submitted_at)
  values (survey_id, now() - interval '2 hours')
  returning id into resp_id;

  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_name_id, 'Ahmad Fauzi');
  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_univ_id, 'Universitas Indonesia');
  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_prov_id, 'Jawa Barat');
  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_jenjang_id, 'Magister');
  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_lokasi_id, 'Dalam Negeri');
  insert into public.answers (response_id, question_id, score_performance, score_importance, reason)
  values (resp_id, q_eval1_id, 1, 5, 'Pencairan dana hidup (living allowance) bulan ini tertunda lebih dari 2 minggu tanpa pemberitahuan. Saya tidak bisa membayar sewa kos dan terancam diusir besok.');
  insert into public.answers (response_id, question_id, score_performance, score_importance) values (resp_id, q_eval2_id, 4, 4);
  insert into public.answers (response_id, question_id, score_performance, score_importance) values (resp_id, q_eval3_id, 4, 5);

  -- Ticket 2: Siti Nurhaliza
  insert into public.responses (survey_id, submitted_at)
  values (survey_id, now() - interval '5 hours')
  returning id into resp_id;

  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_name_id, 'Siti Nurhaliza');
  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_univ_id, 'Universitas Gadjah Mada');
  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_prov_id, 'Jawa Tengah');
  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_jenjang_id, 'Magister');
  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_lokasi_id, 'Dalam Negeri');
  insert into public.answers (response_id, question_id, score_performance, score_importance, reason)
  values (resp_id, q_eval3_id, 2, 5, 'Sistem pelaporan akademik error saat saya mengunggah LoA terbaru. Deadline pengumpulan adalah lusa. Mohon bantuan teknis segera agar status beasiswa saya tidak ditangguhkan.');
  insert into public.answers (response_id, question_id, score_performance, score_importance) values (resp_id, q_eval1_id, 4, 4);
  insert into public.answers (response_id, question_id, score_performance, score_importance) values (resp_id, q_eval2_id, 5, 4);

  -- Ticket 3: Rian Hidayat
  insert into public.responses (survey_id, submitted_at)
  values (survey_id, now() - interval '8 hours')
  returning id into resp_id;

  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_name_id, 'Rian Hidayat');
  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_univ_id, 'Institut Teknologi Bandung');
  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_prov_id, 'Jawa Barat');
  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_jenjang_id, 'Doktor');
  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_lokasi_id, 'Dalam Negeri');
  insert into public.answers (response_id, question_id, score_performance, score_importance, reason)
  values (resp_id, q_eval2_id, 1, 4, 'Layanan monitoring kurang tanggap saat saya melaporkan perubahan dosen pembimbing. Sudah 1 bulan tidak ada kepastian kelanjutan dana riset.');
  insert into public.answers (response_id, question_id, score_performance, score_importance) values (resp_id, q_eval1_id, 4, 4);
  insert into public.answers (response_id, question_id, score_performance, score_importance) values (resp_id, q_eval3_id, 5, 5);

  -- Ticket 4: Dewi Lestari
  insert into public.responses (survey_id, submitted_at)
  values (survey_id, now() - interval '12 hours')
  returning id into resp_id;

  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_name_id, 'Dewi Lestari');
  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_univ_id, 'Universitas Airlangga');
  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_prov_id, 'Jawa Timur');
  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_jenjang_id, 'Magister');
  insert into public.answers (response_id, question_id, text_value) values (resp_id, q_lokasi_id, 'Dalam Negeri');
  insert into public.answers (response_id, question_id, score_performance, score_importance, reason)
  values (resp_id, q_eval1_id, 2, 4, 'Dana tunjangan buku belum cair sejak semester lalu. Saya terpaksa meminjam uang untuk membeli buku referensi wajib.');
  insert into public.answers (response_id, question_id, score_performance, score_importance) values (resp_id, q_eval2_id, 4, 4);
  insert into public.answers (response_id, question_id, score_performance, score_importance) values (resp_id, q_eval3_id, 4, 4);


  -- 6. SIMULATE NORMAL DATA (25 balanced responses for a dynamic CSI of 4.0 - 4.5)
  for i in 1..25 loop
    insert into public.responses (survey_id, submitted_at)
    values (survey_id, now() - (i || ' hours')::interval)
    returning id into resp_id;

    -- Demographics
    insert into public.answers (response_id, question_id, text_value) 
    values (resp_id, q_name_id, 'Awardee ' || i);

    insert into public.answers (response_id, question_id, text_value) 
    values (resp_id, q_univ_id, case (i % 4)
      when 0 then 'Universitas Indonesia'
      when 1 then 'Institut Teknologi Bandung'
      when 2 then 'Universitas Gadjah Mada'
      else 'Universitas Airlangga'
    end);

    insert into public.answers (response_id, question_id, text_value) 
    values (resp_id, q_prov_id, case (i % 4)
      when 0 then 'Jakarta'
      when 1 then 'Jawa Barat'
      when 2 then 'Jawa Tengah'
      else 'Jawa Timur'
    end);

    insert into public.answers (response_id, question_id, text_value) 
    values (resp_id, q_jenjang_id, case (i % 2)
      when 0 then 'Magister'
      else 'Doktor'
    end);

    insert into public.answers (response_id, question_id, text_value) 
    values (resp_id, q_lokasi_id, case (i % 5)
      when 4 then 'Luar Negeri'
      else 'Dalam Negeri'
    end);

    -- Evaluation scores: alternating 4 and 5
    insert into public.answers (response_id, question_id, score_performance, score_importance)
    values (resp_id, q_eval1_id, 4 + (i % 2), 4 + ((i + 1) % 2));

    insert into public.answers (response_id, question_id, score_performance, score_importance)
    values (resp_id, q_eval2_id, 4 + ((i + 1) % 2), 4 + (i % 2));

    insert into public.answers (response_id, question_id, score_performance, score_importance)
    values (resp_id, q_eval3_id, 4 + (i % 2), 4 + (i % 2));
  end loop;

end $$;