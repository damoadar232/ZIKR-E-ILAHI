package com.zikrelahi.api.quran.juz;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JuzRepository extends JpaRepository<Juz, Byte> {

    List<Juz> findAllByOrderByNumberAsc();
}
