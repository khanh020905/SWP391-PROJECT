// @ts-nocheck

"use client";
import React from 'react';

import { Sparkles, Calendar, BookOpen, Clock, Target, CheckCircle2, CheckCircle, Lock, RotateCcw, ChevronRight, AlertCircle, RefreshCw, Trophy, ArrowRight, Play, Check, Undo2, Flame, Award, ChevronLeft } from "lucide-react";

export default function ScoutTemplate(props: any) {
  const { 
    navLabelDisp, currentSetLabel, setMenuRot, toggleSetMenu, setMenuOpen, setOptions,
    goStudy, navItemJustify, navFlashInk, navFlashWeight, navFlashBg, navFlashShadow,
    isFlashcard, cardFrontBg, cardBorder, cardShadow, toggleAutoPlay, autoPlay, autoTrackBg,
    autoKnobLeft, closeConfetti, showConfetti, confettiPieces, miniConfettiPieces, flip, cardTransform, meaningTransform,
    progressPct, progressW, human, total, prev, next, jumpTo, isDashboard, isStats, isLists, isSets, isPersonal,
    accuracy, bandMenuOpen, bandOptions, bandTarget, bars, cardChipBg, cardChipInk, cardHint, cardInk, cardStars, cardSub, cloudColor, cloudHi, cloudLo, cloudLo2, cloudOpacity, cloudShadow, dashClouds, dashStreak, datePickerOpen, examDate, examDays, examDotColor, examDots, examDotsExtra, examMonthsText, exampleEn, exampleVi, flameDays, goKnownTab, goReviewTab, goSets, goUnknownTab, heatLegend, ink2Color, inkColor, ipa, isStudy, knownCount, listAccent, listDesc, listEmpty, listHasRows, listIsReview, listRows, listTitle, studyListAgain, listStudyFlashcard, listStudyQuiz, listStudyListening, listStudyBlank, listStudyMixed, markKnown, markUnknown, calendarMonths, monthCells, monthLabel, monthWeekdays, moonDisp, moonDisplay, nightLayerDisp, personalFolderCount, personalFolders, personalTotal, pickerCells, pickerNext, pickerPrev, pickerTitle, pickerWeekdays, posVi, recentHistory, reviewBadge, reviewMistakes, setCards, setsSummary, skills, speakBtn, starBtn, starFieldBgA, starFieldBgB, starFill2, starStroke2, starsDisp, startBlank, startListening, startMixed, startQuiz, startTidians, sunBlobDisp, sunDisplay, sunFaceDisp, syn, tabKnownBg, tabKnownInk, tabReviewBg, tabReviewInk, tabUnknownBg, tabUnknownInk, tag, toggleBandMenu, toggleDark, toggleDatePicker, totalAdded, totalLearned, totalReview, totalTests, unknownCount, vi, word, userName, sidebarCol, navHeaderJustify, navBrandFlex, navTogRot, toggleNav,
    navSectionDisp, goDashboard, navOverviewBg, navOverviewShadow, navOverviewInk, navOverviewWeight,
    navSetsBg, navSetsShadow, navSetsInk, navSetsWeight, navStatsBg, navStatsShadow, navStatsInk, navStatsWeight,
    navBarsDisp,
    checkType, closePractice, goReview, goStats, hasMistakes, listeningHint, listeningSay, listeningInput, mHearts, mLeft, mMatched, mProgressW, mRight, mScore, mTotal, navBadgeDisp, navKnownBg, navKnownInk, navKnownShadow, navKnownWeight, navReviewBg, navReviewInk, navReviewShadow, navReviewWeight, navUnknownBg, navUnknownInk, navUnknownShadow, navUnknownWeight, pAccent, pAnswerWord, pAnswered, pChecked, pCorrect, pExample, pHintHidden, pHuman, pInput, pInputBorder, pInputPlaceholder, pIpa, pIsContext, pIsListening, pIsMatching, pIsMeaning, pIsQuizOrListen, pLabel, pLen, pLetterSlots, pNextLabel, pOptions, pPosEn, pProgressW, pPromptContext, pPromptBefore, pPromptAfter, pInputSize, pPromptMeaning, pResultEmoji, pResultSub, pResultTitle, pShowCheck, pShowListenBody, pShowMatching, pShowNext, pShowQuizBody, pShowQuizToggle, pShowResult, pTitle, pTypedFbColor, pTypedFeedback, pVi, practiceActive, practiceNext, qmContextBg, qmContextInk, qmMeaningBg, qmMeaningInk, rStatA, rStatALabel, rStatB, rStatBLabel, rStatC, rStatCLabel, restartPractice, setContext, setMeaning, showKnownTabKnown, showKnownTabUnknown,
    openImportModal, createNewFolder, navAvatarUrl,
    isFolderDetail, folderDetailName, folderDetailWords, folderDetailLoading, folderDetailColor, folderDetailDeep,
    goBackToPersonal, openFolderAddWordModal, deleteFolderWord, startRenameFolderDetail, deleteFolderDetail, studyFolderWords,
    goEditProfile, goVocabNotebook, goDiagnostic, goRoadmap, openProfilePanel, openAvatarPanel, openPasswordPanel, closePanel,
    isAdmin, goAdmin, dark,
    appBg, sidebarBg, sidebarGrad, sidebarColor, navSectionColor, navUnselColor, headerBg, headerBorder, searchBg, searchInk, searchKBtn, searchKBorder, searchKColor, panelBorder, panelHover, contentBg, nightCardBg, nightCardBorder, nightCardShadow, titleColor, manifestSub, streakSub, dividerColor, monthCellBg, listHeaderBg, listBorder, listHover, listBtnBg, listBtnInk,
    isEditProfile, profileName, profilePhone, profileBio, profileInAppReminders, profileEmailReminders, profileStreakWarning, profileLoading, profileError, profileSuccess, setProfileName, setProfilePhone, setProfileBio, toggleProfileInAppReminders, toggleProfileEmailReminders, toggleProfileStreakWarning, saveProfile, cancelEditProfile,
    
    isRoadmap, roadmap, roadmapLoading, roadmapActionLoading, roadmapCurrentBand, roadmapTargetBand, roadmapDailyHours,
    roadmapTargetDate, roadmapFocusSkills, roadmapIsGenerating, roadmapGenerationStep, roadmapGenerationProgress,
    roadmapActivePhaseTab, roadmapIsEditingGoals,
    fetchRoadmap, handleRoadmapSkillsChange, startRoadmapAIGeneration, activateRoadmap, toggleRoadmapTask, resetRoadmap, setRoadmapState,
    navRoadmapBg, navRoadmapInk, navRoadmapWeight, navRoadmapShadow,

    isDaily, dailyTasks, dailyTasksLoading, dailyTasksError, dailyTasksCompletingId, fetchDailyTasks, handleCompleteDailyTask,
    navDailyBg, navDailyInk, navDailyWeight, navDailyShadow, goDaily,
    
    ...rest
  } = new Proxy(props || {}, { get: (target, prop) => prop in target ? target[prop] : '' });
  const navInitials = (userName || 'HV').split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0,2).join('');

  return (
    <>
      <style>{`
        @keyframes tidFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes tidPop{0%{transform:scale(.7);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
        @keyframes tidFall{0%{transform:translateY(-30px) rotate(0deg);opacity:1}100%{transform:translateY(680px) rotate(680deg);opacity:0}}
        @keyframes tidBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        @keyframes tidTwinkle{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1)}}
        @keyframes tidMoonGlow{0%,100%{box-shadow:0 0 30px 8px rgba(214,228,255,.45)}50%{box-shadow:0 0 46px 14px rgba(214,228,255,.7)}}
        @keyframes tidHalo{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.07)}}
        @keyframes tidDrift{0%{transform:translateX(0)}100%{transform:translateX(64px)}}
        @keyframes tidDriftB{0%{transform:translateX(0)}100%{transform:translateX(-54px)}}
        @keyframes tidSpin{to{transform:rotate(360deg)}}
        @keyframes tidRise{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes tidDotPop{0%,72%,100%{transform:translateY(0) scale(1);}82%{transform:translateY(-4px) scale(1.18);}}
        @keyframes tidWander{0%{transform:translate(0,0)}25%{transform:translate(46px,-16px)}50%{transform:translate(96px,8px)}75%{transform:translate(44px,20px)}100%{transform:translate(0,0)}}
        @keyframes tidComet{0%{opacity:0;transform:translate(0,0) rotate(28deg) scaleX(1)}1%{opacity:0}4%{opacity:1}11%{opacity:1}16%{opacity:0;transform:translate(-260px,180px) rotate(28deg) scaleX(1)}100%{opacity:0;transform:translate(-260px,180px) rotate(28deg)}}
      `}</style>
        <div data-screen-label="Desktop · Study view" data-sk="app" style={{ width: '100vw', height: '100vh', background: `${appBg}`, overflow: 'hidden', display: 'grid', gridTemplateColumns: `${sidebarCol}`, border: '1px solid rgba(46,53,20,.06)', transition: 'grid-template-columns .32s cubic-bezier(.4,0,.2,1),background-color .35s ease' }}>

    <aside data-sk="sidebar" style={{ background: `${sidebarBg}`, backgroundImage: `${sidebarGrad}`, color: `${sidebarColor}`, padding: '26px 18px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: `${navHeaderJustify}`, gap: '11px', padding: '4px 4px 22px' }}>
        <div onClick={() => window.location.href = '/'} style={{ display: `${navBrandFlex}`, alignItems: 'center', gap: '11px', minWidth: '0', cursor: 'pointer' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F6C453', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '20px', color: '#2A3114', boxShadow: '0 4px 0 rgba(0,0,0,.12)', flexShrink: '0' }}>Q</div>
          <div style={{ lineHeight: '1.05', whiteSpace: 'nowrap' }}>
            <div style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '16px', color: '#FFF8EB' }}>Quali</div>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '.16em', color: '#A9B189' }}>IELTS</div>
          </div>
        </div>
        <button onClick={toggleNav} style={{ width: '34px', height: '34px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: '0' }} data-hover="background:rgba(255,255,255,.2);">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#E6E9D2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `${navTogRot}`, transition: 'transform .3s ease' }}><rect x="3" y="4" width="18" height="16" rx="2.5"></rect><path d="M9 4v16"></path><path d="M15 10l-2 2 2 2"></path></svg>
        </button>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto', paddingBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '.14em', color: `${navSectionColor}`, padding: '8px 12px 6px', display: `${navSectionDisp}` }}>HỌC TẬP</div>
        <button onClick={goDashboard} title="Tổng quan" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: `${navItemJustify}`, gap: '12px', padding: '11px 13px', borderRadius: '13px', color: `${navOverviewInk}`, fontWeight: `${navOverviewWeight}`, fontSize: '14.5px', border: 'none', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', background: navOverviewBg, boxShadow: `${navOverviewShadow}` }} data-hover="filter:brightness(1.04);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: '0' }}><rect x="3" y="3" width="7" height="7" rx="2"></rect><rect x="14" y="3" width="7" height="7" rx="2"></rect><rect x="3" y="14" width="7" height="7" rx="2"></rect><rect x="14" y="14" width="7" height="7" rx="2"></rect></svg>
          <span style={{ display: `${navLabelDisp}`, whiteSpace: 'nowrap' }}>Tổng quan</span>
        </button>
        <div style={{ position: 'relative' }}>
          <button onClick={goSets} title="Bộ từ" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: `${navItemJustify}`, gap: '12px', padding: '11px 13px', borderRadius: '13px', color: `${navSetsInk}`, fontWeight: `${navSetsWeight}`, fontSize: '14.5px', border: 'none', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', background: navSetsBg, boxShadow: `${navSetsShadow}` }} data-hover="filter:brightness(1.04);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: '0' }}><path d="M12 3 2 8l10 5 10-5-10-5Z"></path><path d="M2 13l10 5 10-5"></path><path d="M2 18l10 5 10-5"></path></svg>
            <span style={{ display: `${navLabelDisp}`, whiteSpace: 'nowrap' }}>Bộ từ</span>
            <span style={{ display: `${navLabelDisp}`, marginLeft: 'auto', fontSize: '11px', fontWeight: '700', opacity: '.7', whiteSpace: 'nowrap' }}>{ currentSetLabel }</span>
            <svg onClick={toggleSetMenu} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: '0', display: `${navBadgeDisp}`, transform: `${setMenuRot}`, transition: 'transform .25s ease' }}><path d="m6 9 6 6 6-6"></path></svg>
          </button>
          { (setMenuOpen) ? (<React.Fragment>
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: '0', right: '0', zIndex: '40', background: '#FFF8EB', border: '1px solid ${nightCardBorder}', borderRadius: '14px', boxShadow: '0 18px 40px -14px rgba(0,0,0,.5)', padding: '6px', maxHeight: '340px', overflowY: 'auto' }}>
              <div style={{ fontSize: '10.5px', fontWeight: '800', letterSpacing: '.1em', color: `${titleColor}`, padding: '7px 10px 5px' }}>CHỌN BỘ TỪ</div>
              { (setOptions)?.map?.((so, _index) => (<React.Fragment key={_index}>
                <button onClick={so.pick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', background: so.bg, border: 'none', borderRadius: '10px', padding: '9px 11px', fontFamily: 'inherit', fontWeight: so.weight, fontSize: '14px', color: so.ink, cursor: 'pointer', textAlign: 'left' }} data-hover={`${panelHover}`}>
                  <span style={{ fontSize: '16px' }}>{ so.icon }</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{ so.label }</span>
                  <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700', color: `${titleColor}` }}>{ so.count } từ</span>
                </button>
              </React.Fragment>)) }
            </div>
          </React.Fragment>) : null }
        </div>
        <button onClick={goStudy} title="Flashcard" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: `${navItemJustify}`, gap: '12px', padding: '11px 13px', borderRadius: '13px', color: `${navFlashInk}`, fontWeight: `${navFlashWeight}`, fontSize: '14.5px', border: 'none', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', background: navFlashBg, boxShadow: `${navFlashShadow}` }} data-hover="filter:brightness(1.04);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: '0' }}><rect x="3" y="5" width="18" height="14" rx="2.5"></rect><path d="M3 10h18"></path></svg>
          <span style={{ display: `${navLabelDisp}`, whiteSpace: 'nowrap' }}>Flashcard</span>
          <span style={{ display: `${navLabelDisp}`, marginLeft: 'auto', fontSize: '11px', fontWeight: '700', opacity: '.7', whiteSpace: 'nowrap' }}>{ currentSetLabel }</span>
        </button>
        <button onClick={showKnownTabKnown} title="Đã nhớ" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: `${navItemJustify}`, gap: '12px', padding: '11px 13px', borderRadius: '13px', color: `${navKnownInk}`, fontWeight: `${navKnownWeight}`, fontSize: '14.5px', border: 'none', background: navKnownBg, boxShadow: `${navKnownShadow}`, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }} data-hover="filter:brightness(1.04);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: '0' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><path d="M22 4 12 14.01l-3-3"></path></svg>
          <span style={{ display: `${navLabelDisp}`, whiteSpace: 'nowrap' }}>Đã nhớ</span>
          <span style={{ marginLeft: 'auto', background: '#2A3114', color: '#F6C453', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '999px', display: `${navBadgeDisp}` }}>{ knownCount }</span>
        </button>
        <button onClick={showKnownTabUnknown} title="Chưa nhớ" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: `${navItemJustify}`, gap: '12px', padding: '11px 13px', borderRadius: '13px', color: `${navUnknownInk}`, fontWeight: `${navUnknownWeight}`, fontSize: '14.5px', border: 'none', background: navUnknownBg, boxShadow: `${navUnknownShadow}`, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }} data-hover="filter:brightness(1.04);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: '0' }}><circle cx="12" cy="12" r="10"></circle><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
          <span style={{ display: `${navLabelDisp}`, whiteSpace: 'nowrap' }}>Chưa nhớ</span>
          <span style={{ marginLeft: 'auto', background: '#2A3114', color: '#F6C453', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '999px', display: `${navBadgeDisp}` }}>{ unknownCount }</span>
        </button>
        <button onClick={goReview} title="Cần ôn tập" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: `${navItemJustify}`, gap: '12px', padding: '11px 13px', borderRadius: '13px', color: `${navReviewInk}`, fontWeight: `${navReviewWeight}`, fontSize: '14.5px', border: 'none', background: navReviewBg, boxShadow: `${navReviewShadow}`, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }} data-hover="filter:brightness(1.04);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: '0' }}><path d="M3 3v18M21 21H3"></path><path d="M7 16l4-5 3 3 4-6"></path></svg>
          <span style={{ display: `${navLabelDisp}`, whiteSpace: 'nowrap' }}>Cần ôn tập</span>
          <span style={{ marginLeft: 'auto', background: '#2A3114', color: '#F6C453', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '999px', display: `${navBadgeDisp}` }}>{ reviewBadge }</span>
        </button>
        <button onClick={goRoadmap} title="Lộ trình học AI" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: `${navItemJustify}`, gap: '12px', padding: '11px 13px', borderRadius: '13px', color: `${navRoadmapInk}`, fontWeight: `${navRoadmapWeight}`, fontSize: '14.5px', border: 'none', background: navRoadmapBg, boxShadow: `${navRoadmapShadow}`, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }} data-hover="filter:brightness(1.04);">
          <Sparkles width="20" height="20" style={{ flexShrink: '0' }} />
          <span style={{ display: `${navLabelDisp}`, whiteSpace: 'nowrap' }}>Lộ trình học AI</span>
        </button>
        <button onClick={goDaily} title="Nhiệm vụ hàng ngày" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: `${navItemJustify}`, gap: '12px', padding: '11px 13px', borderRadius: '13px', color: `${navDailyInk}`, fontWeight: `${navDailyWeight}`, fontSize: '14.5px', border: 'none', background: navDailyBg, boxShadow: `${navDailyShadow}`, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }} data-hover="filter:brightness(1.04);">
          <Calendar width="20" height="20" style={{ flexShrink: '0' }} />
          <span style={{ display: `${navLabelDisp}`, whiteSpace: 'nowrap' }}>Nhiệm vụ hàng ngày</span>
        </button>
        <button onClick={goStats} title="Thống kê" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: `${navItemJustify}`, gap: '12px', padding: '11px 13px', borderRadius: '13px', color: `${navStatsInk}`, fontWeight: `${navStatsWeight}`, fontSize: '14.5px', textAlign: 'left', border: 'none', background: navStatsBg, boxShadow: `${navStatsShadow}`, cursor: 'pointer', fontFamily: 'inherit' }} data-hover="filter:brightness(1.04);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: '0' }}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path></svg>
          <span style={{ display: `${navLabelDisp}`, whiteSpace: 'nowrap' }}>Thống kê</span>
        </button>

        <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '.14em', color: `${navSectionColor}`, padding: '18px 12px 6px', display: `${navSectionDisp}` }}>TÀI KHOẢN</div>
        <button onClick={goEditProfile} title="Chỉnh sửa hồ sơ" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: `${navItemJustify}`, gap: '12px', padding: '11px 13px', borderRadius: '13px', color: isEditProfile ? '#2A3114' : `${navUnselColor}`, fontWeight: isEditProfile ? '800' : '600', fontSize: '14.5px', textAlign: 'left', border: 'none', background: isEditProfile ? '#F6C453' : 'transparent', boxShadow: isEditProfile ? '0 4px 0 rgba(0,0,0,.14)' : 'none', cursor: 'pointer', fontFamily: 'inherit' }} data-hover="filter:brightness(1.04);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: '0' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span style={{ display: `${navLabelDisp}`, whiteSpace: 'nowrap' }}>Chỉnh sửa hồ sơ</span>
        </button>

        {isAdmin && (
          <button onClick={goAdmin} title="Trang quản trị" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: `${navItemJustify}`, gap: '12px', padding: '11px 13px', borderRadius: '13px', color: '#F6C453', fontWeight: '800', fontSize: '14.5px', textAlign: 'left', border: '1px solid rgba(246,196,83,.35)', background: 'rgba(246,196,83,.12)', cursor: 'pointer', fontFamily: 'inherit' }} data-hover="filter:brightness(1.08);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: '0' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <span style={{ display: `${navLabelDisp}`, whiteSpace: 'nowrap' }}>Trang quản trị</span>
          </button>
        )}
      </nav>

      <div title="Chuỗi học 7 ngày" style={{ marginTop: 'auto', background: 'rgba(0,0,0,.16)', borderRadius: '18px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: `${navItemJustify}`, width: '100%' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(238,154,35,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#F6C453" stroke="#EE9A23" strokeWidth="1.2"><path d="M12 2c1 3-1 4-1 6 2-1 3 1 4 2 2 2 2 5 0 7a6 6 0 0 1-9-1c-1-2 0-4 1-5 0 2 1 3 2 3-1-2 0-4 1-5 1 2 2 1 2-1 1-2 0-4-2-6Z"></path></svg>
          </div>
          <div style={{ lineHeight: '1.1', display: `${navLabelDisp}` }}>
            <div style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '18px', color: '#FFF8EB' }}>{ dashStreak } ngày</div>
            <div style={{ fontSize: '11.5px', color: '#A9B189', fontWeight: '700' }}>Chuỗi học liên tục</div>
          </div>
        </div>
        <div style={{ display: `${navBarsDisp}`, gap: '5px', width: '100%' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} style={{ flex: '1', height: '8px', borderRadius: '4px', background: i < Math.min(dashStreak || 0, 7) ? '#F6C453' : 'rgba(255,255,255,.16)' }}></span>
          ))}
        </div>
      </div>
    </aside>

    <main style={{ display: 'flex', flexDirection: 'column', minWidth: '0', minHeight: '0', overflow: 'hidden' }}>
      <header data-sk="header" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 28px', borderBottom: `1px solid ${headerBorder}`, background: `${headerBg}` }}>
        <div data-sk="search" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', maxWidth: '380px', background: `${searchBg}`, borderRadius: '14px', padding: '10px 14px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={`${searchInk}`} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4-4"></path></svg>
          <span style={{ color: `${searchInk}`, fontSize: '14px', fontWeight: '500' }}>Tìm từ vựng, bộ thẻ…</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700', color: `${searchKColor}`, background: `${searchKBtn}`, border: `1px solid ${searchKBorder}`, borderRadius: '7px', padding: '2px 6px' }}>⌘K</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#FFF3D6', border: '1px solid #F6C453', borderRadius: '12px', padding: '7px 12px' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#EE9A23" stroke="#C2693B" strokeWidth="1"><path d="M12 2c1 3-1 4-1 6 2-1 3 1 4 2 2 2 2 5 0 7a6 6 0 0 1-9-1c-1-2 0-4 1-5 0 2 1 3 2 3-1-2 0-4 1-5 1 2 2 1 2-1 1-2 0-4-2-6Z"></path></svg>
            <span style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '15px', color: '#9a5a14' }}>{ dashStreak || 0 }</span>
          </div>
          <button onClick={toggleDark} data-sk="panel" style={{ width: '40px', height: '40px', borderRadius: '12px', border: `1px solid ${panelBorder}`, background: `${headerBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} data-hover={`${panelHover}`}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#EE9A23" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ display: `${sunDisplay}` }}><circle cx="12" cy="12" r="4.5"></circle><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"></path></svg>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="#F6C453" stroke="#F6C453" strokeWidth="1.6" strokeLinejoin="round" style={{ display: `${moonDisplay}` }}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z"></path></svg>
          </button>
          <button data-sk="panel" style={{ width: '40px', height: '40px', borderRadius: '12px', border: `1px solid ${panelBorder}`, background: `${headerBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }} data-hover={`${panelHover}`}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#5D6B2D" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.7 21a2 2 0 0 1-3.4 0"></path></svg>
            <span style={{ position: 'absolute', top: '8px', right: '9px', width: '8px', height: '8px', borderRadius: '50%', background: '#EE9A23', border: '2px solid #fff' }}></span>
          </button>
          <div data-sk="panel" style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '4px 10px 4px 4px', border: `1px solid ${nightCardBorder}`, borderRadius: '999px', cursor: 'pointer' }} data-hover={`${panelHover}`}>
            { navAvatarUrl
              ? <img src={navAvatarUrl} alt={userName} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: '0' }} />
              : <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#5D6B2D', color: '#FFF8EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '13px', flexShrink: '0' }}>{ navInitials }</div>
            }
            <span data-sk="ink" style={{ fontWeight: '800', fontSize: '14px', color: `${inkColor}` }}>{ userName }</span>
          </div>
        </div>
      </header>

      <div data-sk="content" style={{ background: `${contentBg}`, flex: '1', padding: '30px 34px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', overflowY: 'auto', overflowX: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: '0', zIndex: '0', pointerEvents: 'none', overflow: 'hidden' }}>
          { (dashClouds)?.map?.((cl, _index) => (<React.Fragment key={_index}>
            <div style={{ position: 'absolute', top: `${cl.top}`, left: `${cl.left}`, width: `${cl.w}`, height: `${cl.h}`, opacity: `${cl.op}`, filter: `${cloudShadow}`, animation: `tidWander ${cl.dur} ease-in-out ${cl.delay} infinite` }}>
              <svg viewBox="0 0 120 64" style={{ width: '100%', height: '100%' }}>
                <defs><radialGradient id="cg" cx="38%" cy="30%" r="80%"><stop offset="0%" stopColor={cloudHi}></stop><stop offset="100%" stopColor={cloudLo}></stop></radialGradient></defs>
                <ellipse cx="60" cy="44" rx="52" ry="17" fill={cloudLo2}></ellipse>
                <circle cx="40" cy="34" r="20" fill="url(#cg)"></circle>
                <circle cx="66" cy="28" r="24" fill="url(#cg)"></circle>
                <circle cx="88" cy="36" r="17" fill="url(#cg)"></circle>
                <circle cx="30" cy="40" r="14" fill="url(#cg)"></circle>
              </svg>
            </div>
          </React.Fragment>)) }
        </div>
        { (isDashboard) ? (<React.Fragment>
<div style={{ position: 'relative', zIndex: '1', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'tidRise .4s ease both' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}` }}>TỔNG QUAN · TIẾN ĐỘ LUYỆN ĐỀ </div>
              <h2 data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '26px', margin: '5px 0 0', color: `${inkColor}` }}>Chào Long, hôm nay luyện đề nhé!</h2>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '16px', position: 'relative' }}>

            <div data-sk="nightcard" style={{ gridColumn: 'span 3', background: `${nightCardBg}`, border: `1px solid ${nightCardBorder}`, borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'visible', boxShadow: `${nightCardShadow}`, display: 'flex', flexDirection: 'column' }}>
              <div aria-hidden="true" style={{ position: 'absolute', inset: '0', borderRadius: '24px', overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', inset: '0', display: `${nightLayerDisp}` }}>
                  { (cardStars)?.map?.((st, _index) => (<React.Fragment key={_index}>
                    <svg viewBox="0 0 24 24" style={{ position: 'absolute', top: `${st.top}`, left: `${st.left}`, width: `${st.size}`, height: `${st.size}`, animation: `tidTwinkle ${st.dur} ease-in-out ${st.delay} infinite` }}><path d="M12 0C12.7 6.4 17.6 11.3 24 12 17.6 12.7 12.7 17.6 12 24 11.3 17.6 6.4 12.7 0 12 6.4 11.3 11.3 6.4 12 0Z" fill="#EAF1FF"></path></svg>
                  </React.Fragment>)) }
                </div>
                <div style={{ position: 'absolute', top: '-58px', right: '-46px', width: '150px', height: '150px', borderRadius: '50%', background: '#F6A82C', display: `${sunBlobDisp}` }}></div>
                <div style={{ position: 'absolute', top: '-34px', right: '-22px', width: '108px', height: '108px', borderRadius: '50%', background: '#F6C453', display: `${sunFaceDisp}`, alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '24px' }}>
                  <svg width="62" height="34" viewBox="0 0 62 34"><circle cx="22" cy="12" r="3.6" fill="#2A3114"></circle><circle cx="40" cy="12" r="3.6" fill="#2A3114"></circle><path d="M20 21c3.5 5 18 5 22 0" stroke="#2A3114" strokeWidth="3.2" fill="none" strokeLinecap="round"></path></svg>
                </div>
                <div style={{ position: 'absolute', top: '-70px', right: '-56px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,219,255,.45) 0%,rgba(160,190,250,.2) 44%,transparent 68%)', display: `${moonDisp}`, animation: 'tidHalo 5s ease-in-out infinite' }}></div>
                <div style={{ position: 'absolute', top: '-34px', right: '-22px', width: '108px', height: '108px', borderRadius: '50%', background: 'radial-gradient(circle at 38% 34%,#FCFDFF,#C4D4F2)', boxShadow: '0 0 34px 8px rgba(198,217,255,.55)', display: `${moonDisp}`, alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '24px', animation: 'tidMoonGlow 4s ease-in-out infinite', overflow: 'hidden' }}>
                  <span style={{ position: 'absolute', top: '22px', left: '26px', width: '11px', height: '11px', borderRadius: '50%', background: 'rgba(150,167,210,.4)' }}></span>
                  <span style={{ position: 'absolute', top: '52px', left: '58px', width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(150,167,210,.34)' }}></span>
                  <svg width="62" height="34" viewBox="0 0 62 34" style={{ position: 'relative', zIndex: '1' }}><circle cx="22" cy="12" r="3.6" fill="#2B3A63"></circle><circle cx="40" cy="12" r="3.6" fill="#2B3A63"></circle><path d="M20 21c3.5 5 18 5 22 0" stroke="#2B3A63" strokeWidth="3.2" fill="none" strokeLinecap="round"></path></svg>
                </div>
              </div>

              <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}`, position: 'relative' }}>MANIFEST BAND ĐIỂM</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px', position: 'relative', flexWrap: 'wrap' }}>
                <span data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '72px', lineHeight: '.85', letterSpacing: '-.02em', color: `${inkColor}` }}>{ bandTarget }</span>
                <div style={{ position: 'relative' }}>
                  <button onClick={toggleBandMenu} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F6C453', border: 'none', borderRadius: '13px', padding: '11px 15px', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '14px', color: '#2A3114', cursor: 'pointer', boxShadow: '0 4px 0 #d6a531' }} data-hover="filter:brightness(1.05);">
                    Chọn band
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                  </button>
                  { (bandMenuOpen) ? (<React.Fragment>
                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '0', zIndex: '30', background: `${headerBg}`, border: '1px solid ${nightCardBorder}', borderRadius: '14px', boxShadow: '0 18px 40px -14px rgba(46,53,20,.55)', padding: '6px', width: '128px', maxHeight: '228px', overflow: 'auto' }}>
                      { (bandOptions)?.map?.((bo, _index) => (<React.Fragment key={_index}>
                        <button onClick={bo.pick} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `${bo.bg}`, border: 'none', borderRadius: '9px', padding: '9px 12px', fontFamily: '\'Nunito\'', fontWeight: `${bo.weight}`, fontSize: '15px', color: `${bo.ink}`, cursor: 'pointer' }} data-hover={`${panelHover}`}>
                          { bo.v }
                          { (bo.sel) ? (<React.Fragment>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5D6B2D" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                          </React.Fragment>) : null }
                        </button>
                      </React.Fragment>)) }
                    </div>
                  </React.Fragment>) : null }
                </div>
              </div>
              <p data-sk="ink2" style={{ margin: '16px 0 0', fontSize: '13.5px', fontWeight: '600', color: `${manifestSub}`, lineHeight: '1.5', position: 'relative', maxWidth: '230px' }}>Đặt mục tiêu band điểm và để TID đồng hành cùng bạn mỗi ngày 🌱</p>
            </div>

            <div data-sk="nightcard" style={{ gridColumn: 'span 3', background: `${nightCardBg}`, border: `1px solid ${nightCardBorder}`, borderRadius: '24px', padding: '22px', boxShadow: `${nightCardShadow}`, position: 'relative', overflow: 'hidden', isolation: 'isolate' }}>
              <div aria-hidden="true" style={{ position: 'absolute', inset: '0', borderRadius: '24px', overflow: 'hidden', pointerEvents: 'none', zIndex: '-1', display: `${nightLayerDisp}` }}><div style={{ position: 'absolute', inset: '0', backgroundImage: `${starFieldBgA}`, animation: 'tidTwinkle 2.6s ease-in-out infinite' }}></div><div style={{ position: 'absolute', inset: '0', backgroundImage: `${starFieldBgB}`, animation: 'tidTwinkle 3.4s ease-in-out .8s infinite' }}></div></div>
              <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}` }}>CHUỖI NGÀY HỌC</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px' }}>
                <div style={{ position: 'relative', width: '50px', height: '50px', flexShrink: '0' }}>
                  <svg width="50" height="50" viewBox="0 0 24 24" fill="#EE9A23" stroke="#C2693B" strokeWidth="1"><path d="M12 2c1 3-1 4-1 6 2-1 3 1 4 2 2 2 2 5 0 7a6 6 0 0 1-9-1c-1-2 0-4 1-5 0 2 1 3 2 3-1-2 0-4 1-5 1 2 2 1 2-1 1-2 0-4-2-6Z"></path></svg>
                  <span style={{ position: 'absolute', top: '-4px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: '#F6C453', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 0 #d6a531' }}>
                    <svg width="11" height="11" viewBox="0 0 100 100"><g stroke="#9a5a14" strokeWidth="9" strokeLinecap="round"><line x1="50" y1="10" x2="50" y2="22"></line><line x1="50" y1="78" x2="50" y2="90"></line><line x1="10" y1="50" x2="22" y2="50"></line><line x1="78" y1="50" x2="90" y2="50"></line></g><circle cx="50" cy="50" r="20" fill="#9a5a14"></circle></svg>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px' }}>
                  <span data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '46px', lineHeight: '.9', color: `${inkColor}` }}>{ dashStreak }</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: `${manifestSub}` }}>ngày liên tiếp</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '7px', marginTop: '16px' }}>
                { (flameDays)?.map?.((fd, _index) => (<React.Fragment key={_index}>
                  <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    { (fd.done) ? (<React.Fragment>
                      <span style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#EE9A23', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 0 #c2693b' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="#FFF8EB"><path d="M12 2c1 3-1 4-1 6 2-1 3 1 4 2 2 2 2 5 0 7a6 6 0 0 1-9-1c-1-2 0-4 1-5 0 2 1 3 2 3-1-2 0-4 1-5 1 2 2 1 2-1 1-2 0-4-2-6Z"></path></svg>
                      </span>
                    </React.Fragment>) : null }
                    { (fd.today) ? (<React.Fragment>
                      <span style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px dashed #E0A52E', background: '#FFF8EB' }}></span>
                    </React.Fragment>) : null }
                    <span style={{ fontSize: '11px', fontWeight: '800', color: `${titleColor}` }}>{ fd.label }</span>
                  </div>
                </React.Fragment>)) }
              </div>
            </div>

            <div data-sk="nightcard" style={{ gridColumn: 'span 2', background: `${nightCardBg}`, border: `1px solid ${nightCardBorder}`, borderRadius: '24px', padding: '22px', boxShadow: `${nightCardShadow}`, position: 'relative', overflow: 'hidden', isolation: 'isolate' }}>
              <div aria-hidden="true" style={{ position: 'absolute', inset: '0', borderRadius: '24px', overflow: 'hidden', pointerEvents: 'none', zIndex: '-1', display: `${nightLayerDisp}` }}><div style={{ position: 'absolute', inset: '0', backgroundImage: `${starFieldBgA}`, animation: 'tidTwinkle 2.6s ease-in-out infinite' }}></div><div style={{ position: 'absolute', inset: '0', backgroundImage: `${starFieldBgB}`, animation: 'tidTwinkle 3.4s ease-in-out .8s infinite' }}></div></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}` }}>KỸ NĂNG GẦN ĐÂY</span>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#b6bb9c' }}>band /9</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '16px' }}>
                { (skills)?.map?.((sk, _index) => (<React.Fragment key={_index}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                      <span data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '15px', color: `${inkColor}` }}>{ sk.name }</span>
                      <span style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '15px', color: `${sk.color}` }}>{ sk.band }</span>
                    </div>
                    <div data-sk="m-track" style={{ height: '9px', borderRadius: '6px', background: '${nightCardBorder}', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${sk.w}`, borderRadius: '6px', background: `${sk.color}` }}></div>
                    </div>
                  </div>
                </React.Fragment>)) }
              </div>
              <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', fontWeight: '600', color: `${manifestSub}` }}>Tổng <b data-sk="ink" style={{ color: `${inkColor}` }}>{ totalTests }</b> bài đã làm</div>
            </div>

            <div data-sk="nightcard" style={{ gridColumn: 'span 4', background: `${nightCardBg}`, border: `1px solid ${nightCardBorder}`, borderRadius: '24px', padding: '22px', boxShadow: `${nightCardShadow}`, position: 'relative', overflow: 'hidden', isolation: 'isolate' }}>
              <div aria-hidden="true" style={{ position: 'absolute', inset: '0', borderRadius: '24px', overflow: 'hidden', pointerEvents: 'none', zIndex: '-1', display: `${nightLayerDisp}` }}><div style={{ position: 'absolute', inset: '0', backgroundImage: `${starFieldBgA}`, animation: 'tidTwinkle 2.6s ease-in-out infinite' }}></div><div style={{ position: 'absolute', inset: '0', backgroundImage: `${starFieldBgB}`, animation: 'tidTwinkle 3.4s ease-in-out .8s infinite' }}></div></div>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: '#FFF3D6' }}></div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', position: 'relative' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}` }}>ĐẾM NGƯỢC KỲ THI</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px', marginTop: '12px' }}>
                    <span data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '54px', lineHeight: '.9', color: `${inkColor}` }}>{ examDays }</span>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: `${manifestSub}` }}>ngày nữa</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ position: 'relative' }}>
                    <button onClick={toggleDatePicker} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#EEF1E2', border: 'none', borderRadius: '10px', padding: '7px 11px', cursor: 'pointer', fontFamily: 'inherit' }} data-hover="background:#E0E6CD;">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5D6B2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2.5"></rect><path d="M3 10h18M8 2v4M16 2v4"></path></svg>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#5D6B2D' }}>{ examDate }</span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5D6B2D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                    </button>
                    { (datePickerOpen) ? (<React.Fragment>
                      <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: '0', zIndex: '50', background: `${headerBg}`, border: '1px solid ${nightCardBorder}', borderRadius: '16px', boxShadow: '0 22px 46px -16px rgba(46,53,20,.5)', padding: '14px', width: '266px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <button onClick={pickerPrev} style={{ width: '30px', height: '30px', borderRadius: '9px', border: `1px solid ${nightCardBorder}`, background: `${searchBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} data-hover={`${panelHover}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5D6B2D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
                          </button>
                          <span style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '14.5px', color: '#2A3114' }}>{ pickerTitle }</span>
                          <button onClick={pickerNext} style={{ width: '30px', height: '30px', borderRadius: '9px', border: `1px solid ${nightCardBorder}`, background: `${searchBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} data-hover={`${panelHover}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5D6B2D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"></path></svg>
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '4px' }}>
                          { (pickerWeekdays)?.map?.((wd, _index) => (<React.Fragment key={_index}>
                            <span style={{ textAlign: 'center', fontSize: '10.5px', fontWeight: '800', color: `${titleColor}`, padding: '3px 0' }}>{ wd.l }</span>
                          </React.Fragment>)) }
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
                          { (pickerCells)?.map?.((pc, _index) => (<React.Fragment key={_index}>
                            <button onClick={pc.pick} style={{ aspectRatio: '1', border: 'none', borderRadius: '9px', background: `${pc.bg}`, color: `${pc.ink}`, fontFamily: '\'Nunito\'', fontWeight: `${pc.weight}`, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} data-hover={`${panelHover}`}>{ pc.day }</button>
                          </React.Fragment>)) }
                        </div>
                      </div>
                    </React.Fragment>) : null }
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: `${titleColor}` }}>≈ { examMonthsText }</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '20px', position: 'relative', alignItems: 'center' }}>
                { (examDots)?.map?.((ed, _index) => (<React.Fragment key={_index}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: `${ed.bg}`, opacity: `${ed.op}` }}></span>
                </React.Fragment>)) }
                <span data-sk="ink2" style={{ fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '12px', color: `${manifestSub}`, marginLeft: '4px' }}>{ examDotsExtra }</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '16px', position: 'relative', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: `${manifestSub}` }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EE9A23' }}></span>7 ngày tới</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: `${manifestSub}` }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: `${examDotColor}` }}></span>Mỗi chấm là một ngày</span>
              </div>
            </div>

            <div data-sk="nightcard" style={{ gridColumn: 'span 4', background: `${nightCardBg}`, border: `1px solid ${nightCardBorder}`, borderRadius: '24px', padding: '24px', boxShadow: `${nightCardShadow}`, position: 'relative', overflow: 'hidden', isolation: 'isolate' }}>
              <div aria-hidden="true" style={{ position: 'absolute', inset: '0', borderRadius: '24px', overflow: 'hidden', pointerEvents: 'none', zIndex: '-1', display: `${nightLayerDisp}` }}><div style={{ position: 'absolute', inset: '0', backgroundImage: `${starFieldBgA}`, animation: 'tidTwinkle 2.6s ease-in-out infinite' }}></div><div style={{ position: 'absolute', inset: '0', backgroundImage: `${starFieldBgB}`, animation: 'tidTwinkle 3.4s ease-in-out .8s infinite' }}></div></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}` }}>HOẠT ĐỘNG HỌC TẬP · { monthLabel }</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: `${titleColor}` }}>Ít</span>
                  { (heatLegend)?.map?.((lg, _index) => (<React.Fragment key={_index}>
                    <span style={{ width: '13px', height: '13px', borderRadius: '3px', background: `${lg}` }}></span>
                  </React.Fragment>)) }
                  <span style={{ fontSize: '11px', fontWeight: '700', color: `${titleColor}` }}>Nhiều</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px' }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,36px)', gap: '5px', marginBottom: '7px' }}>
                    { (monthWeekdays)?.map?.((wd, _index) => (<React.Fragment key={_index}>
                      <span style={{ textAlign: 'center', fontSize: '10.5px', fontWeight: '800', letterSpacing: '.02em', color: `${titleColor}` }}>{ wd.l }</span>
                    </React.Fragment>)) }
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,36px)', gap: '5px', gridAutoRows: '36px' }}>
                    { (calendarMonths && calendarMonths.length > 0 ? calendarMonths[calendarMonths.length - 1].cells : [])?.map?.((cl, _index) => (<React.Fragment key={_index}>
                      <div title={cl.day} style={{ position: 'relative', borderRadius: '8px', background: `${cl.bg}`, color: `${cl.ink}`, boxShadow: `${cl.shadow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', fontFamily: '\'Nunito\'', opacity: cl.blank?'0':'1' }}>
                        { cl.day }
                      </div>
                    </React.Fragment>)) }
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#FFF3D6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', boxShadow: '0 4px 12px rgba(0,0,0,.15)' }}>🔥</div>
                    <span style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '52px', color: `${inkColor}`, lineHeight: '1' }}>{ dashStreak || 0 }</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: `${titleColor}`, letterSpacing: '.02em' }}>ngày streak liên tiếp</span>
                </div>
              </div>
            </div>

            <div data-sk="nightcard" style={{ gridColumn: 'span 2', background: `${nightCardBg}`, border: `1px solid ${nightCardBorder}`, borderRadius: '24px', padding: '22px', boxShadow: `${nightCardShadow}`, position: 'relative', overflow: 'hidden', isolation: 'isolate' }}>
              <div aria-hidden="true" style={{ position: 'absolute', inset: '0', borderRadius: '24px', overflow: 'hidden', pointerEvents: 'none', zIndex: '-1', display: `${nightLayerDisp}` }}><div style={{ position: 'absolute', inset: '0', backgroundImage: `${starFieldBgA}`, animation: 'tidTwinkle 2.6s ease-in-out infinite' }}></div><div style={{ position: 'absolute', inset: '0', backgroundImage: `${starFieldBgB}`, animation: 'tidTwinkle 3.4s ease-in-out .8s infinite' }}></div></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}` }}>LỊCH SỬ GẦN ĐÂY</span>
                <button style={{ background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: '800', color: '#5D6B2D', cursor: 'pointer', padding: '0' }} data-hover="color:#46531F;">Xem tất cả</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                { (!recentHistory || recentHistory.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: `${manifestSub}`, fontSize: '14px', fontWeight: '600' }}>Lịch sử của bạn đang trống</div>
                ) : (
                  (recentHistory)?.map?.((rh: any, _index: number) => (<React.Fragment key={_index}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '14px 0', borderBottom: `1px solid ${dividerColor}` }}>
                      <span style={{ width: '38px', height: '38px', borderRadius: '11px', background: '#EEF1E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#5D6B2D" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5.5A1.5 1.5 0 0 1 4.5 4H10a2.5 2.5 0 0 1 2 1 2.5 2.5 0 0 1 2-1h5.5A1.5 1.5 0 0 1 21 5.5V18a1 1 0 0 1-1 1h-6a2 2 0 0 0-2 1 2 2 0 0 0-2-1H4a1 1 0 0 1-1-1V5.5Z"></path><path d="M16.5 7.5v4l1.6-1 1.6 1v-4"></path></svg>
                      </span>
                      <div style={{ flex: '1', minWidth: '0' }}>
                        <div data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '14.5px', lineHeight: '1.25', color: `${inkColor}` }}>{ rh.title }</div>
                        <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '.05em', color: '#b6bb9c', marginTop: '3px', textTransform: 'uppercase' }}>{ rh.ago }</div>
                      </div>
                      <span style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '17px', color: '#2E9D7E', flexShrink: '0' }}>{ rh.score }</span>
                    </div>
                  </React.Fragment>))
                )}
              </div>
            </div>

          </div>
          </div>
        </div>
        </React.Fragment>) : null }
        { (isEditProfile) ? (<React.Fragment>
          <div style={{ position: 'relative', zIndex: '1', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'tidRise .4s ease both', maxWidth: '680px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}` }}>TÀI KHOẢN</div>
              <h2 data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '26px', margin: '5px 0 0', color: `${inkColor}` }}>Chỉnh sửa hồ sơ cá nhân</h2>
            </div>

            <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div data-sk="nightcard" style={{ background: `${nightCardBg}`, border: `1px solid ${nightCardBorder}`, borderRadius: '24px', padding: '24px', boxShadow: `${nightCardShadow}`, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {profileError && (
                  <div style={{ padding: '12px 16px', borderRadius: '14px', background: '#F7E7DE', border: '1px solid #D8A78C', color: '#b9694a', fontSize: '13px', fontWeight: '700' }}>
                    ⚠️ {profileError}
                  </div>
                )}
                {profileSuccess && (
                  <div style={{ padding: '12px 16px', borderRadius: '14px', background: '#E7F0DD', border: '1px solid #9DB87E', color: '#5D6B2D', fontSize: '13px', fontWeight: '700' }}>
                    ✓ {profileSuccess}
                  </div>
                )}

                {/* Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '.08em', color: `${titleColor}`, textTransform: 'uppercase' }}>Họ và Tên</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    style={{ width: '100%', padding: '12px 16px', background: `${searchBg}`, border: `1px solid ${nightCardBorder}`, borderRadius: '14px', color: `${inkColor}`, fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
                  />
                </div>

                {/* Phone */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '.08em', color: `${titleColor}`, textTransform: 'uppercase' }}>Số điện thoại</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="0912345678"
                    style={{ width: '100%', padding: '12px 16px', background: `${searchBg}`, border: `1px solid ${nightCardBorder}`, borderRadius: '14px', color: `${inkColor}`, fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
                  />
                </div>

                {/* Bio */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '.08em', color: `${titleColor}`, textTransform: 'uppercase' }}>Giới thiệu bản thân (Tối đa 300 ký tự)</label>
                  <textarea
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value.slice(0, 300))}
                    placeholder="Chia sẻ một chút thông tin về bạn..."
                    rows={4}
                    style={{ width: '100%', padding: '12px 16px', background: `${searchBg}`, border: `1px solid ${nightCardBorder}`, borderRadius: '14px', color: `${inkColor}`, fontSize: '14px', fontFamily: 'inherit', outline: 'none', resize: 'none' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '10.5px', fontWeight: '700', color: `${titleColor}` }}>
                    {profileBio.length}/300 ký tự
                  </div>
                </div>

                {/* Reminders section */}
                <div style={{ borderTop: `1px solid ${dividerColor}`, paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '15px', color: `${inkColor}`, margin: '0' }}>Cấu hình thông báo & nhắc nhở</h3>
                    <p style={{ fontSize: '11.5px', color: `${titleColor}`, fontWeight: '600', margin: '3px 0 0' }}>Lựa chọn cách bạn muốn nhận các nhắc nhở học tập và chuỗi streak.</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* In-app reminder */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: `${searchBg}`, borderRadius: '16px', border: `1px solid ${nightCardBorder}` }}>
                      <div>
                        <h4 style={{ fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '14px', color: `${inkColor}`, margin: '0' }}>Thông báo trong ứng dụng</h4>
                        <p style={{ fontSize: '11px', color: `${titleColor}`, fontWeight: '600', margin: '2px 0 0', maxWidth: '380px' }}>Nhận các nhắc nhở học tập và tin nhắn hệ thống trực tiếp khi truy cập trang web.</p>
                      </div>
                      <button
                        type="button"
                        onClick={toggleProfileInAppReminders}
                        style={{ position: 'relative', width: '42px', height: '24px', borderRadius: '999px', background: profileInAppReminders ? '#5D6B2D' : '#D8D2BE', border: 'none', cursor: 'pointer', transition: 'background .25s', flexShrink: 0 }}
                      >
                        <span style={{ position: 'absolute', top: '3px', left: profileInAppReminders ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: `${headerBg}`, boxShadow: '0 1px 3px rgba(0,0,0,.25)', transition: 'left .25s cubic-bezier(.3,.8,.4,1)' }}></span>
                      </button>
                    </div>

                    {/* Email reminder */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: `${searchBg}`, borderRadius: '16px', border: `1px solid ${nightCardBorder}` }}>
                      <div>
                        <h4 style={{ fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '14px', color: `${inkColor}`, margin: '0' }}>Nhắc nhở học tập qua Email</h4>
                        <p style={{ fontSize: '11px', color: `${titleColor}`, fontWeight: '600', margin: '2px 0 0', maxWidth: '380px' }}>Nhận email động viên học tập hàng ngày nếu hôm đó bạn chưa rèn luyện kỹ năng nào.</p>
                      </div>
                      <button
                        type="button"
                        onClick={toggleProfileEmailReminders}
                        style={{ position: 'relative', width: '42px', height: '24px', borderRadius: '999px', background: profileEmailReminders ? '#5D6B2D' : '#D8D2BE', border: 'none', cursor: 'pointer', transition: 'background .25s', flexShrink: 0 }}
                      >
                        <span style={{ position: 'absolute', top: '3px', left: profileEmailReminders ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: `${headerBg}`, boxShadow: '0 1px 3px rgba(0,0,0,.25)', transition: 'left .25s cubic-bezier(.3,.8,.4,1)' }}></span>
                      </button>
                    </div>

                    {/* Streak Warning */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: `${searchBg}`, borderRadius: '16px', border: `1px solid ${nightCardBorder}` }}>
                      <div>
                        <h4 style={{ fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '14px', color: `${inkColor}`, margin: '0' }}>Cảnh báo sắp mất chuỗi học tập (Streak)</h4>
                        <p style={{ fontSize: '11px', color: `${titleColor}`, fontWeight: '600', margin: '2px 0 0', maxWidth: '380px' }}>Nhận cảnh báo khẩn cấp khi chuỗi học tập của bạn sắp bị đặt lại về 0.</p>
                      </div>
                      <button
                        type="button"
                        onClick={toggleProfileStreakWarning}
                        style={{ position: 'relative', width: '42px', height: '24px', borderRadius: '999px', background: profileStreakWarning ? '#5D6B2D' : '#D8D2BE', border: 'none', cursor: 'pointer', transition: 'background .25s', flexShrink: 0 }}
                      >
                        <span style={{ position: 'absolute', top: '3px', left: profileStreakWarning ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: `${headerBg}`, boxShadow: '0 1px 3px rgba(0,0,0,.25)', transition: 'left .25s cubic-bezier(.3,.8,.4,1)' }}></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={profileLoading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#5D6B2D', border: 'none', borderRadius: '16px', padding: '14px 28px', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '15px', color: '#FFF8EB', cursor: profileLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 0 #3E4A1B', opacity: profileLoading ? 0.6 : 1 }}
                >
                  {profileLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditProfile}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${nightCardBorder}`, borderRadius: '16px', padding: '14px 24px', fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '15px', color: `${inkColor}`, cursor: 'pointer' }}
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </React.Fragment>) : null }
        { (isRoadmap) ? (<React.Fragment>
          <div style={{ position: 'relative', zIndex: '1', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'tidRise .4s ease both' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}` }}>LỘ TRÌNH</div>
              <h2 data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '26px', margin: '5px 0 0', color: `${inkColor}` }}>Lộ trình học tập AI</h2>
            </div>
            
            {roadmapLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', background: `${headerBg}`, border: `1px solid ${panelBorder}`, borderRadius: '24px', padding: '48px' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid rgba(93, 107, 45, 0.3)', borderTopColor: '#5D6B2D', borderRadius: '50%', animation: 'tidSpin 1s linear infinite', marginBottom: '16px' }} />
                <p style={{ fontSize: '13px', fontWeight: '800', color: `${ink2Color}`, animation: 'tidHalo 2s ease-in-out infinite' }}>Đang tải lộ trình học AI...</p>
              </div>
            ) : roadmapIsGenerating ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '500px', background: `${nightCardBg}`, border: `1px solid ${nightCardBorder}`, borderRadius: '24px', padding: '48px', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: `${nightCardShadow}` }}>
                <div style={{ position: 'relative', width: '144px', height: '144px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'absolute', inset: '0', borderRadius: '50%', border: '2px dashed rgba(93, 107, 45, 0.3)', animation: 'tidSpin 12s linear infinite' }} />
                  <div style={{ position: 'absolute', inset: '8px', borderRadius: '50%', border: '1px double rgba(179, 143, 77, 0.4)', animation: 'tidSpin 6s linear infinite reverse' }} />
                  <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg, #5D6B2D, #B38F4D)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,0,0,.25)' }}>
                    <Sparkles width="40" height="40" color="#fff" style={{ animation: 'tidHalo 2s ease-in-out infinite' }} />
                  </div>
                </div>
                <h3 style={{ fontFamily: 'Nunito', fontWeight: '900', fontSize: '20px', color: `${inkColor}`, margin: '0 0 8px' }}>Trợ Lý AI Đang Thiết Lập Lộ Trình</h3>
                
                <div style={{ width: '100%', maxWidth: '440px', background: `${searchBg}`, border: `1px solid ${nightCardBorder}`, height: '10px', borderRadius: '999px', overflow: 'hidden', marginBottom: '24px' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #5D6B2D, #B38F4D)', transition: 'width 0.3s ease', borderRadius: '999px', width: `${roadmapGenerationProgress}%` }} />
                </div>

                <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', background: 'rgba(0,0,0,.1)', padding: '20px', borderRadius: '18px', border: `1px solid ${nightCardBorder}` }}>
                  {[
                    "Đang quét hồ sơ học viên & kỹ năng mục tiêu...",
                    "Đang đo khoảng cách chênh lệch band điểm hiện tại và đích...",
                    "Đang phân bổ giáo trình Cambridge IELTS tương thích...",
                    "AI đang biên soạn danh sách nhiệm vụ ôn tập cá nhân hóa..."
                  ].map((stepText, idx) => {
                    const isDone = roadmapGenerationStep > idx;
                    const isActive = roadmapGenerationStep === idx;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', opacity: isDone || isActive ? 1 : 0.35 }}>
                        {isDone ? (
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#5d6b2d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Check width="14" height="14" color="#FFF8EB" />
                          </div>
                        ) : isActive ? (
                          <div style={{ width: '20px', height: '20px', border: '2.5px solid #5d6b2d', borderTopColor: 'transparent', borderRadius: '50%', animation: 'tidSpin 0.7s linear infinite', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `1.5px solid ${titleColor}`, flexShrink: 0 }} />
                        )}
                        <span style={{ fontWeight: '800', color: isActive ? '#5D6B2D' : `${inkColor}` }}>{stepText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (!roadmap || roadmapIsEditingGoals) ? (
              <div style={{ background: `${nightCardBg}`, border: `1px solid ${nightCardBorder}`, borderRadius: '24px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px', boxShadow: `${nightCardShadow}`, animation: 'tidRise .4s ease both' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', borderBottom: `1px solid ${dividerColor}`, paddingBottom: '20px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, #5D6B2D, #8b946c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF8EB', boxShadow: '0 4px 12px rgba(93,107,45,0.2)' }}>
                    <Sparkles width="24" height="24" style={{ animation: 'tidFloat 3s ease-in-out infinite' }} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'Nunito', fontWeight: '900', fontSize: '20px', color: `${inkColor}`, margin: 0 }}>
                      {roadmap ? "Cập Nhật Mục Tiêu Học Tập" : "Thiết Lập Lộ Trình Học IELTS Với AI"}
                    </h2>
                    <p style={{ fontSize: '12.5px', color: `${titleColor}`, fontWeight: '600', margin: '4px 0 0' }}>
                      Cung cấp mục tiêu và khả năng hiện tại của bạn, trợ lý AI sẽ tự động phân tích và chia nhỏ giáo trình giúp bạn đạt điểm mong muốn.
                    </p>
                  </div>
                </div>

                {!roadmap && (
                  <div style={{ background: 'rgba(238, 154, 35, 0.08)', border: '1.5px solid rgba(238, 154, 35, 0.25)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EE9A23' }}>
                        <Sparkles width="16" height="16" />
                        <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '.08em' }}>Kiểm Tra Năng Lực Đầu Vào</span>
                      </div>
                      <h3 style={{ fontFamily: 'Nunito', fontWeight: '900', fontSize: '15px', color: `${inkColor}`, margin: 0 }}>Bạn chưa biết Band điểm IELTS hiện tại của mình?</h3>
                      <p style={{ fontSize: '12.5px', color: `${titleColor}`, fontWeight: '600', margin: 0, lineHeight: '1.5' }}>
                        Tham gia làm bài kiểm tra nhanh 10 phút (Listening, Reading, Grammar) để AI phân tích chính xác trình độ và tự động thiết kế lộ trình tối ưu cho bạn.
                      </p>
                    </div>
                    <button
                      onClick={goDiagnostic}
                      style={{ alignSelf: 'flex-start', background: 'linear-gradient(90deg, #5D6B2D, #B38F4D)', color: '#FFF8EB', border: 'none', borderRadius: '12px', padding: '10px 18px', fontSize: '12.5px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(93,107,45,0.15)' }}
                    >
                      Làm Test Đầu Vào Ngay <ArrowRight width="14" height="14" />
                    </button>
                  </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); startRoadmapAIGeneration(e); }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', background: `${searchBg}`, border: `1px solid ${nightCardBorder}`, padding: '20px', borderRadius: '18px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '.08em', color: `${inkColor}` }}>Band Điểm Hiện Tại</label>
                        <span style={{ fontSize: '12px', fontWeight: '900', background: 'rgba(93,107,45,0.12)', color: '#5D6B2D', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(93,107,45,0.15)' }}>
                          Band {roadmapCurrentBand.toFixed(1)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="3.0"
                        max="8.5"
                        step="0.5"
                        value={roadmapCurrentBand}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setRoadmapState({
                            roadmapCurrentBand: val,
                            roadmapTargetBand: Math.max(val + 0.5, roadmapTargetBand)
                          });
                        }}
                        style={{ width: '100%', height: '6px', borderRadius: '4px', background: `${dividerColor}`, accentColor: '#5D6B2D', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: `${titleColor}` }}>
                        <span>3.0</span>
                        <span>4.5</span>
                        <span>6.0</span>
                        <span>7.5</span>
                        <span>8.5</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '.08em', color: `${inkColor}` }}>Band Điểm Mục Tiêu</label>
                        <span style={{ fontSize: '12px', fontWeight: '900', background: 'rgba(179,143,77,0.12)', color: '#B38F4D', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(179,143,77,0.15)' }}>
                          Band {roadmapTargetBand.toFixed(1)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={(roadmapCurrentBand + 0.5).toString()}
                        max="9.0"
                        step="0.5"
                        value={roadmapTargetBand}
                        onChange={(e) => setRoadmapState({ roadmapTargetBand: parseFloat(e.target.value) })}
                        style={{ width: '100%', height: '6px', borderRadius: '4px', background: `${dividerColor}`, accentColor: '#B38F4D', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: `${titleColor}` }}>
                        <span>{(roadmapCurrentBand + 0.5).toFixed(1)}</span>
                        <span>6.0</span>
                        <span>7.0</span>
                        <span>8.0</span>
                        <span>9.0</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: '800', color: `${inkColor}`, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar width="16" height="16" color={titleColor} /> Ngày Thi Dự Kiến
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={roadmapTargetDate}
                        onChange={(e) => setRoadmapState({ roadmapTargetDate: e.target.value })}
                        style={{ width: '100%', padding: '12px 16px', background: `${searchBg}`, border: `1.5px solid ${nightCardBorder}`, borderRadius: '12px', color: `${inkColor}`, fontFamily: 'inherit', fontSize: '13.5px', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: '800', color: `${inkColor}`, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock width="16" height="16" color={titleColor} /> Thời Gian Học Mỗi Ngày
                      </label>
                      <select
                        value={roadmapDailyHours}
                        onChange={(e) => setRoadmapState({ roadmapDailyHours: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '12px 16px', background: `${searchBg}`, border: `1.5px solid ${nightCardBorder}`, borderRadius: '12px', color: `${inkColor}`, fontFamily: 'inherit', fontSize: '13.5px', outline: 'none' }}
                      >
                        <option value={1.0}>1.0 giờ / ngày</option>
                        <option value={1.5}>1.5 giờ / ngày</option>
                        <option value={2.0}>2.0 giờ / ngày (Khuyên dùng)</option>
                        <option value={3.0}>3.0 giờ / ngày (Cường độ cao)</option>
                        <option value={4.0}>4.0 giờ / ngày (Cấp tốc)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: '800', color: `${inkColor}`, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Target width="16" height="16" color={titleColor} /> Kỹ Năng Cần Tập Trung
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      {["Listening", "Reading", "Writing", "Speaking"].map((skill) => {
                        const isChecked = roadmapFocusSkills.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleRoadmapSkillsChange(skill)}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '12px',
                              border: isChecked ? '2px solid #5D6B2D' : `1.5px solid ${nightCardBorder}`,
                              background: isChecked ? 'rgba(93,107,45,0.08)' : `${searchBg}`,
                              color: isChecked ? '#5D6B2D' : `${inkColor}`,
                              fontFamily: 'inherit',
                              fontSize: '13px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              transition: 'all .15s'
                            }}
                          >
                            {isChecked && <Check width="14" height="14" />}
                            <span>{skill}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px', borderTop: `1px solid ${dividerColor}`, paddingTop: '20px' }}>
                    <button
                      type="submit"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#5D6B2D', border: 'none', borderRadius: '16px', padding: '14px 28px', fontFamily: 'inherit', fontWeight: '900', fontSize: '15px', color: '#FFF8EB', cursor: 'pointer', boxShadow: '0 4px 0 #3E4A1B' }}
                    >
                      <Sparkles width="16" height="16" />
                      <span>{roadmap ? "Tái Tạo Lộ Trình AI" : "Thiết Lập Lộ Trình Bằng AI"}</span>
                    </button>
                    {roadmap && (
                      <button
                        type="button"
                        onClick={() => setRoadmapState({ roadmapIsEditingGoals: false })}
                        style={{ background: 'transparent', border: `1.5px solid ${nightCardBorder}`, borderRadius: '16px', padding: '14px 24px', fontFamily: 'inherit', fontWeight: '800', fontSize: '15px', color: `${inkColor}`, cursor: 'pointer' }}
                      >
                        Hủy bỏ
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : roadmap.status === "PROPOSED" ? (
              <div style={{ background: `${nightCardBg}`, border: `1px solid ${nightCardBorder}`, borderRadius: '24px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px', boxShadow: `${nightCardShadow}`, animation: 'tidRise .4s ease both' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${dividerColor}`, paddingBottom: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '.08em', color: '#B38F4D', background: 'rgba(179,143,77,0.12)', padding: '2px 8px', borderRadius: '6px' }}>Lộ trình đề xuất từ AI</span>
                      <span style={{ fontSize: '11.5px', fontWeight: '700', color: `${titleColor}` }}>Tạo ngày {new Date(roadmap.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <h2 style={{ fontFamily: 'Nunito', fontWeight: '900', fontSize: '22px', color: `${inkColor}`, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      IELTS Band {roadmap.currentBand.toFixed(1)} <ArrowRight width="18" height="18" color="#B38F4D" /> Band {roadmap.targetBand.toFixed(1)}
                    </h2>
                  </div>
                  <button
                    onClick={() => setRoadmapState({ roadmapIsEditingGoals: true })}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: `${searchBg}`, border: `1.5px solid ${nightCardBorder}`, borderRadius: '12px', padding: '8px 16px', fontSize: '12.5px', fontWeight: '800', color: `${inkColor}`, cursor: 'pointer' }}
                  >
                    <RefreshCw width="14" height="14" /> Chỉnh sửa mục tiêu
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', paddingLeft: '24px' }}>
                  <div style={{ position: 'absolute', left: '8px', top: '12px', bottom: '12px', width: '2px', background: 'linear-gradient(to bottom, #5D6B2D, rgba(238,154,35,0.4))' }} />
                  {roadmap.phases.map((phase: any, idx: number) => (
                    <div key={phase.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-20px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: '#5d6b2d', border: `2px solid ${contentBg}` }} />
                      <div>
                        <h4 style={{ fontFamily: 'Nunito', fontWeight: '900', fontSize: '15.5px', color: `${inkColor}`, margin: 0 }}>{phase.title}</h4>
                        <p style={{ fontSize: '12.5px', color: `${titleColor}`, fontWeight: '600', margin: '4px 0 0' }}>{phase.description}</p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {phase.skills.map((skill: string, sIdx: number) => (
                            <span key={sIdx} style={{ fontSize: '10px', fontWeight: '800', background: `${searchBg}`, border: `1px solid ${nightCardBorder}`, padding: '2px 8px', borderRadius: '6px', color: `${titleColor}` }}>{skill}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ background: `${searchBg}`, border: `1px solid ${nightCardBorder}`, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {phase.tasks.map((task: any) => (
                          <div key={task.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: `${headerBg}`, border: `1px solid ${dividerColor}`, padding: '12px', borderRadius: '12px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(93,107,45,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <BookOpen width="14" height="14" color="#5d6b2d" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '13px', fontWeight: '800', color: `${inkColor}` }}>{task.title}</span>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: `${titleColor}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock width="12" height="12" /> Thời gian ước tính: {task.estimatedHours}h
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${dividerColor}`, paddingTop: '20px', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '800', color: `${inkColor}`, margin: 0 }}>Lộ trình này đã được AI tùy chỉnh hoàn toàn phù hợp với cấu hình của bạn.</p>
                    <p style={{ fontSize: '11.5px', color: `${titleColor}`, fontWeight: '600', margin: '2px 0 0' }}>Nhấp nút bên phải để lưu lộ trình và bắt đầu đếm ngược thời gian ôn thi.</p>
                  </div>
                  <button
                    onClick={activateRoadmap}
                    disabled={roadmapActionLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#5D6B2D', border: 'none', borderRadius: '16px', padding: '14px 28px', fontFamily: 'inherit', fontWeight: '900', fontSize: '15px', color: '#FFF8EB', cursor: 'pointer', boxShadow: '0 4px 0 #3E4A1B' }}
                  >
                    <Play width="16" height="16" fill="#FFF8EB" />
                    <span>Chấp Nhận & Bắt Đầu Học</span>
                  </button>
                </div>
              </div>
            ) : (() => {
              const activePhase = roadmap.phases.find((p: any) => p.id === roadmapActivePhaseTab) || roadmap.phases[0];
              const totalDays = Math.ceil((new Date(roadmap.targetDate).getTime() - new Date(roadmap.createdAt).getTime()) / (24 * 60 * 60 * 1000));
              const remainingDays = Math.max(0, Math.ceil((new Date(roadmap.targetDate).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)));
              
              let totalTasks = 0;
              let completedTasks = 0;
              roadmap.phases.forEach((p: any) => {
                p.tasks.forEach((t: any) => {
                  totalTasks++;
                  if (t.completed) completedTasks++;
                });
              });
              const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: `${nightCardBg}`, border: `1px solid ${nightCardBorder}`, borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: `${nightCardShadow}` }}>
                      <h3 style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '.08em', color: `${titleColor}`, marginBottom: '16px' }}>Tiến Độ Lộ Trình</h3>
                      
                      <div style={{ position: 'relative', width: '128px', height: '128px', marginBottom: '16px' }}>
                        <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke={dark ? 'rgba(255,255,255,.05)' : '#F2EEE0'} strokeWidth="8" />
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="url(#roadmapProgressGrad)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${(progressPct / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
                            style={{ transition: 'stroke-dasharray 0.5s ease' }}
                          />
                          <defs>
                            <linearGradient id="roadmapProgressGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#5D6B2D" />
                              <stop offset="100%" stopColor="#B38F4D" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '28px', fontWeight: '900', color: `${inkColor}`, lineHeight: 1 }}>{progressPct}%</span>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: `${titleColor}`, marginTop: '2px' }}>Hoàn thành</span>
                        </div>
                      </div>

                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', background: `${searchBg}`, padding: '12px', borderRadius: '12px', border: `1px solid ${dividerColor}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: `${titleColor}` }}>
                          <span>Nhiệm vụ:</span>
                          <span style={{ fontWeight: '900', color: `${inkColor}` }}>{completedTasks} / {totalTasks}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: `${titleColor}` }}>
                          <span>Còn lại:</span>
                          <span style={{ fontWeight: '900', color: `${inkColor}` }}>{remainingDays} ngày ôn</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: `${nightCardBg}`, border: `1px solid ${nightCardBorder}`, borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: `${nightCardShadow}` }}>
                      <h3 style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '.08em', color: `${titleColor}`, borderBottom: `1px solid ${dividerColor}`, paddingBottom: '8px', margin: 0 }}>Mục Tiêu</h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(238,154,35,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EE9A23' }}>
                            <Target width="16" height="16" />
                          </div>
                          <div>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: `${titleColor}`, textTransform: 'uppercase', display: 'block' }}>Mục tiêu band</span>
                            <span style={{ fontSize: '12.5px', fontWeight: '800', color: `${inkColor}` }}>{roadmap.currentBand.toFixed(1)} → {roadmap.targetBand.toFixed(1)}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(93,107,45,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5D6B2D' }}>
                            <Clock width="16" height="16" />
                          </div>
                          <div>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: `${titleColor}`, textTransform: 'uppercase', display: 'block' }}>Cường độ học</span>
                            <span style={{ fontSize: '12.5px', fontWeight: '800', color: `${inkColor}` }}>{roadmap.dailyHours} giờ / ngày</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(179,143,77,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B38F4D' }}>
                            <Calendar width="16" height="16" />
                          </div>
                          <div>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: `${titleColor}`, textTransform: 'uppercase', display: 'block' }}>Ngày thi dự kiến</span>
                            <span style={{ fontSize: '12.5px', fontWeight: '800', color: `${inkColor}` }}>{new Date(roadmap.targetDate).toLocaleDateString("vi-VN")}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: `1px solid ${dividerColor}`, paddingTop: '12px' }}>
                        <button
                          onClick={() => {
                            const seg = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'vi';
                            const locale = (seg === 'en' || seg === 'vi') ? seg : 'vi';
                            window.location.href = `/${locale}/orientation?retest=true&pathId=${roadmap.id}`;
                          }}
                          style={{ width: '100%', padding: '8px 0', border: 'none', background: '#5D6B2D', color: '#FFF8EB', borderRadius: '12px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', transition: 'all .15s', boxShadow: '0 4px 0 #3E4A1B', marginBottom: '4px' }}
                        >
                          Làm bài test lại để kiểm tra tiến bộ
                        </button>
                        <button
                          onClick={() => setRoadmapState({ roadmapIsEditingGoals: true })}
                          style={{ width: '100%', padding: '8px 0', border: `1.5px solid ${nightCardBorder}`, background: `${searchBg}`, color: `${inkColor}`, borderRadius: '12px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all .15s' }}
                        >
                          Sửa mục tiêu / Tạo lại
                        </button>
                        <button
                          onClick={resetRoadmap}
                          style={{ width: '100%', padding: '8px 0', border: '1.5px solid rgba(255,122,122,0.2)', background: 'transparent', color: '#FF7A7A', borderRadius: '12px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all .15s' }}
                        >
                          Đặt lại lộ trình học
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #46531F, #2A3114)', border: '1px solid rgba(255,255,255,.05)', borderRadius: '24px', padding: '24px', color: '#FFF8EB', position: 'relative', overflow: 'hidden', boxShadow: `${nightCardShadow}` }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '.08em', color: '#FFF8EB', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '6px' }}>Lộ trình đang học</span>
                          {remainingDays > 0 ? (
                            <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '.08em', color: '#FFF8EB', background: '#EE9A23', padding: '2px 8px', borderRadius: '6px', animation: 'tidHalo 2s ease-in-out infinite' }}>Còn {remainingDays} ngày</span>
                          ) : (
                            <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '.08em', color: '#FFF8EB', background: '#5D6B2D', padding: '2px 8px', borderRadius: '6px' }}>Đã hoàn tất kỳ ôn</span>
                          )}
                        </div>
                        <h2 style={{ fontFamily: 'Nunito', fontWeight: '900', fontSize: '20px', margin: 0 }}>Chinh Phục IELTS Band {roadmap.targetBand.toFixed(1)}</h2>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0, fontWeight: '500', lineHeight: '1.4' }}>Tập trung thực hành mỗi ngày theo từng nhiệm vụ dưới đây. AI sẽ ghi nhận và cập nhật trực tiếp tiến độ của bạn.</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', borderBottom: `1.5px solid ${dividerColor}`, paddingBottom: '1px' }}>
                      {roadmap.phases.map((phase: any) => {
                        const isActive = roadmapActivePhaseTab === phase.id;
                        const phaseTasks = phase.tasks;
                        const completedCount = phaseTasks.filter((t: any) => t.completed).length;
                        const totalCount = phaseTasks.length;
                        const isPhaseDone = completedCount === totalCount && totalCount > 0;
                        
                        let phaseLabel = "Giai đoạn 3";
                        if (phase.id === "phase_1") phaseLabel = "Giai đoạn 1";
                        else if (phase.id === "phase_2") phaseLabel = "Giai đoạn 2";

                        return (
                          <button
                            key={phase.id}
                            onClick={() => setRoadmapState({ roadmapActivePhaseTab: phase.id })}
                            style={{
                              paddingBottom: '12px',
                              border: 'none',
                              borderBottom: isActive ? '3.5px solid #5D6B2D' : '3.5px solid transparent',
                              background: 'transparent',
                              fontFamily: 'inherit',
                              fontSize: '13.5px',
                              fontWeight: '900',
                              color: isActive ? '#5D6B2D' : `${titleColor}`,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'all 0.15s'
                            }}
                          >
                            <span>{phaseLabel}</span>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '800',
                              padding: '2px 6px',
                              borderRadius: '6px',
                              background: isPhaseDone ? '#5D6B2D' : (isActive ? 'rgba(93,107,45,0.12)' : `${searchBg}`),
                              color: isPhaseDone ? '#FFF8EB' : (isActive ? '#5D6B2D' : `${titleColor}`)
                            }}>
                              {completedCount}/{totalCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ background: `${searchBg}`, border: `1px solid ${nightCardBorder}`, padding: '20px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '.08em', color: `${titleColor}`, margin: 0 }}>Mục tiêu Giai Đoạn</h4>
                      <p style={{ fontSize: '13px', color: `${inkColor}`, fontWeight: '700', margin: 0, lineHeight: '1.5' }}>{activePhase.description}</p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {activePhase.skills.map((skill: string, sIdx: number) => (
                          <span key={sIdx} style={{ fontSize: '10px', fontWeight: '800', background: `${headerBg}`, border: `1px solid ${dividerColor}`, padding: '2px 8px', borderRadius: '6px', color: `${titleColor}` }}>{skill}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {activePhase.tasks.map((task: any) => (
                        <div
                          key={task.id}
                          onClick={() => toggleRoadmapTask(activePhase.id, task.id, !task.completed)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '16px',
                            padding: '16px',
                            borderRadius: '18px',
                            border: `1.5px solid ${task.completed ? dividerColor : nightCardBorder}`,
                            background: task.completed ? 'transparent' : `${headerBg}`,
                            opacity: task.completed ? 0.6 : 1,
                            cursor: 'pointer',
                            boxShadow: task.completed ? 'none' : '0 4px 12px rgba(46,53,20,0.02)',
                            transition: 'all .2s'
                          }}
                        >
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '6px',
                            border: task.completed ? '2px solid #5D6B2D' : `2px solid ${titleColor}`,
                            background: task.completed ? '#5D6B2D' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFF8EB',
                            flexShrink: 0,
                            marginTop: '2px',
                            transition: 'all 0.15s'
                          }}>
                            {task.completed && <Check width="14" height="14" strokeWidth="3" />}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                            <span style={{ fontSize: '13.5px', fontWeight: '900', color: `${inkColor}`, textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</span>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: `${titleColor}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock width="12" height="12" /> {task.estimatedHours}h luyện tập
                              </span>
                              {task.completed && (
                                <span style={{ fontSize: '10px', fontWeight: '900', color: '#5D6B2D', background: 'rgba(93,107,45,0.08)', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 width="12" height="12" /> Đã hoàn thành & Cộng Streak
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </React.Fragment>) : null }
        { (isDaily) ? (<React.Fragment>
          <div style={{ position: 'relative', zIndex: '1', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'tidRise .4s ease both' }}>
            
            {/* Header section */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EEF1E2', border: '1px solid #C7D1B8', color: '#5D6B2D', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>
                  <Sparkles width="12" height="12" style={{ animation: 'tidHalo 2s infinite' }} /> Lộ trình học tập cá nhân
                </div>
                <h2 data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '26px', margin: '0', color: `${inkColor}` }}>
                  Nhiệm vụ học hàng ngày
                </h2>
                <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: `${titleColor}`, fontWeight: '600', maxWidth: '500px', lineHeight: '1.5' }}>
                  Mỗi ngày là một bước tiến gần hơn đến mục tiêu IELTS. Hãy hoàn thành đề thi thử được AI cá nhân hóa để mở khóa bài học tiếp theo.
                </p>
              </div>

              {/* Progress Widget */}
              {(!dailyTasksLoading && dailyTasks && dailyTasks.length > 0) && (() => {
                const total = dailyTasks.length;
                const completed = dailyTasks.filter((t: any) => t.status === "completed").length;
                const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div style={{ background: `${nightCardBg}`, border: `1px solid ${nightCardBorder}`, borderRadius: '20px', padding: '16px 20px', minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: `${nightCardShadow}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: `${titleColor}`, textTransform: 'uppercase' }}>Tiến độ tổng thể</span>
                      <span style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '14px', color: '#5D6B2D' }}>{progressPct}%</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #5D6B2D, #8AA04A)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: `${titleColor}` }}>
                      <Trophy width="14" height="14" color="#EE9A23" />
                      <span>Đã hoàn thành {completed}/{total} ngày</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Content states */}
            {dailyTasksLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', background: `${headerBg}`, border: `1px solid ${panelBorder}`, borderRadius: '24px', padding: '48px' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid rgba(93, 107, 45, 0.3)', borderTopColor: '#5D6B2D', borderRadius: '50%', animation: 'tidSpin 1s linear infinite', marginBottom: '16px' }} />
                <p style={{ fontSize: '13px', fontWeight: '800', color: `${ink2Color}`, animation: 'tidHalo 2s ease-in-out infinite' }}>Đang tải danh sách nhiệm vụ...</p>
              </div>
            ) : dailyTasksError ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', background: `${headerBg}`, border: `1.5px solid rgba(255,122,122,0.2)`, borderRadius: '24px', padding: '48px', textAlign: 'center' }}>
                <AlertCircle width="40" height="40" color="#FF7A7A" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontFamily: 'Nunito', fontWeight: '900', fontSize: '18px', color: '#FF7A7A', margin: '0 0 8px' }}>Lỗi Tải Dữ Liệu</h3>
                <p style={{ fontSize: '13px', fontWeight: '600', color: `${titleColor}`, margin: '0 0 20px', maxWidth: '360px' }}>{dailyTasksError}</p>
                <button onClick={fetchDailyTasks} style={{ background: '#5D6B2D', border: 'none', borderRadius: '12px', padding: '10px 20px', fontFamily: 'inherit', fontWeight: '900', fontSize: '14px', color: '#FFF8EB', cursor: 'pointer', boxShadow: '0 3px 0 #3E4A1B' }}>Thử lại</button>
              </div>
            ) : (!dailyTasks || dailyTasks.length === 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '340px', background: `${headerBg}`, border: `1px solid ${panelBorder}`, borderRadius: '24px', padding: '48px', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#EEF1E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5d6b2d" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><path d="m16.2 8.6-6.6 6.6-3-3"/></svg>
                </div>
                <h3 style={{ fontFamily: 'Nunito', fontWeight: '900', fontSize: '18px', color: `${inkColor}`, margin: '0 0 6px' }}>Chưa kích hoạt lộ trình</h3>
                <p style={{ fontSize: '13px', fontWeight: '600', color: `${titleColor}`, margin: '0 0 24px', maxWidth: '360px', lineHeight: '1.4' }}>Hãy hoàn thành bài Diagnostic Test để AI chuẩn bị lộ trình và kích hoạt Daily Tasks cho bạn nhé!</p>
                <button onClick={goDiagnostic} style={{ background: '#5D6B2D', border: 'none', borderRadius: '14px', padding: '12px 28px', fontFamily: 'inherit', fontWeight: '900', fontSize: '14.5px', color: '#FFF8EB', cursor: 'pointer', boxShadow: '0 4px 0 #3E4A1B' }}>Bắt đầu ngay</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', borderLeft: '2px dashed rgba(0,0,0,0.06)', marginLeft: '12px', paddingLeft: '24px' }}>
                {dailyTasks.map((task: any, idx: number) => {
                  const isCompleted = task.status === "completed";
                  const isUnlocked = task.unlocked;
                  const isLocked = !isCompleted && !isUnlocked;
                  const exam = task.exams;
                  
                  // route mapping
                  const match = typeof window !== 'undefined' ? window.location.pathname.match(/^\/(en|vi)\b/) : null;
                  const locale = match ? match[1] : 'vi';
                  const examRoute = exam ? (
                    exam.category?.toLowerCase() === 'listening' ? `/${locale}/listening/${exam.id}` :
                    exam.category?.toLowerCase() === 'reading' ? `/${locale}/reading/${exam.id}` :
                    exam.category?.toLowerCase() === 'writing' ? `/${locale}/writing/${exam.id}` :
                    exam.category?.toLowerCase() === 'speaking' ? `/${locale}/speaking/test?examId=${exam.id}&mode=mock` : '#'
                  ) : '#';

                  return (
                    <div key={task.id} style={{ position: 'relative' }}>
                      {/* Timeline node dot */}
                      <span style={{
                        position: 'absolute',
                        left: '-37px',
                        top: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: isCompleted ? '#5D6B2D' : isUnlocked ? '#5D6B2D' : '#D1D5DB',
                        background: isCompleted ? '#5D6B2D' : '#fff',
                        color: isCompleted ? '#fff' : isUnlocked ? '#5D6B2D' : '#9CA3AF',
                        zIndex: 2,
                        transition: 'all 0.3s'
                      }}>
                        {isCompleted ? (
                          <CheckCircle width="14" height="14" />
                        ) : isLocked ? (
                          <Lock width="10" height="10" />
                        ) : (
                          <span style={{ fontSize: '9px', fontWeight: '900' }}>{task.day_index}</span>
                        )}
                      </span>

                      {/* Card container */}
                      <div style={{
                        background: `${headerBg}`,
                        border: isUnlocked && !isCompleted ? '1.5px solid #5D6B2D' : `1px solid ${panelBorder}`,
                        borderRadius: '20px',
                        padding: '20px',
                        boxShadow: isUnlocked && !isCompleted ? '0 8px 30px rgba(93,107,45,0.06)' : 'none',
                        opacity: isLocked ? 0.65 : 1,
                        transition: 'all 0.3s'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#5D6B2D', letterSpacing: '.05em' }}>
                              Ngày {task.day_index} • Giai đoạn {task.phase_id?.replace("phase_", "")}
                            </span>
                            <h4 style={{ fontFamily: 'Nunito', fontWeight: '900', fontSize: '17px', margin: '0', color: `${inkColor}` }}>
                              {task.task_title}
                            </h4>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: `${titleColor}` }}>
                              Nhiệm vụ {task.day_in_task}/{task.total_days_in_task} của bài học này
                            </span>
                          </div>

                          {/* Status badges */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isCompleted ? (
                              <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#10B981', background: 'rgba(16,185,129,0.08)', padding: '4px 10px', borderRadius: '20px' }}>
                                Hoàn thành
                              </span>
                            ) : isUnlocked ? (
                              <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#5D6B2D', background: 'rgba(93,107,45,0.08)', padding: '4px 10px', borderRadius: '20px', animation: 'tidHalo 2s infinite' }}>
                                Đang mở
                              </span>
                            ) : (
                              <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#9CA3AF', background: 'rgba(0,0,0,0.04)', padding: '4px 10px', borderRadius: '20px' }}>
                                Chưa mở
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Mapped Exam Item */}
                        {exam && (
                          <div style={{
                            marginTop: '16px',
                            background: `${searchBg}`,
                            border: `1px solid ${nightCardBorder}`,
                            borderRadius: '16px',
                            padding: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '16px',
                            flexWrap: 'wrap'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(93,107,45,0.1)', display: 'flex', alignItems: 'center', justifyContent: 0, flexShrink: 0, justifyContent: 'center' }}>
                                <BookOpen width="16" height="16" color="#5d6b2d" />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <h5 style={{ fontFamily: 'Nunito', fontWeight: '900', fontSize: '14.5px', margin: '0', color: `${inkColor}` }}>
                                  Đề luyện tập: {exam.title}
                                </h5>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: `${titleColor}` }}>
                                  <span style={{ textTransform: 'uppercase', color: '#5D6B2D' }}>{exam.category}</span>
                                  <span>•</span>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock width="12" height="12" /> {exam.duration_minutes} phút
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {isUnlocked && !isCompleted && (
                                <>
                                  <button
                                    onClick={() => window.location.href = examRoute}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#5D6B2D', border: 'none', borderRadius: '12px', padding: '9px 16px', fontFamily: 'inherit', fontWeight: '900', fontSize: '13px', color: '#FFF8EB', cursor: 'pointer', boxShadow: '0 3px 0 #3E4A1B' }}
                                  >
                                    <Play width="14" height="14" fill="#FFF8EB" />
                                    <span>Làm bài ngay</span>
                                  </button>
                                  <button
                                    onClick={() => handleCompleteDailyTask(task.id)}
                                    disabled={dailyTasksCompletingId === task.id}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: `1px solid ${nightCardBorder}`, borderRadius: '12px', padding: '9px 16px', fontFamily: 'inherit', fontWeight: '800', fontSize: '13px', color: `${inkColor}`, cursor: dailyTasksCompletingId === task.id ? 'not-allowed' : 'pointer' }}
                                  >
                                    {dailyTasksCompletingId === task.id ? "Đang xử lý..." : "Hoàn thành"}
                                  </button>
                                </>
                              )}
                              {isCompleted && (
                                <button
                                  onClick={() => window.location.href = examRoute}
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: `1.5px solid ${nightCardBorder}`, borderRadius: '12px', padding: '9px 16px', fontFamily: 'inherit', fontWeight: '900', fontSize: '13px', color: '#5D6B2D', cursor: 'pointer' }}
                                >
                                  <RotateCcw width="14" height="14" />
                                  <span>Luyện tập lại</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </React.Fragment>) : null }
        { (isStudy) ? (<React.Fragment>
        <div aria-hidden="true" style={{ position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: '0', opacity: `${cloudOpacity}`, transition: 'opacity .4s ease' }}>
          <svg viewBox="0 0 120 40" style={{ position: 'absolute', top: '6%', left: '8%', width: '170px', height: 'auto', animation: 'tidDrift 14s ease-in-out infinite alternate' }}><g fill={cloudColor}><ellipse cx="40" cy="26" rx="38" ry="13"></ellipse><circle cx="38" cy="18" r="15"></circle><circle cx="62" cy="20" r="12"></circle><circle cx="22" cy="21" r="11"></circle></g></svg>
          <svg viewBox="0 0 120 40" style={{ position: 'absolute', top: '30%', right: '6%', width: '140px', height: 'auto', animation: 'tidDriftB 18s ease-in-out infinite alternate' }}><g fill={cloudColor}><ellipse cx="40" cy="26" rx="38" ry="13"></ellipse><circle cx="38" cy="18" r="15"></circle><circle cx="62" cy="20" r="12"></circle><circle cx="22" cy="21" r="11"></circle></g></svg>
          <svg viewBox="0 0 120 40" style={{ position: 'absolute', bottom: '14%', left: '18%', width: '120px', height: 'auto', animation: 'tidDrift 20s ease-in-out infinite alternate' }}><g fill={cloudColor}><ellipse cx="40" cy="26" rx="38" ry="13"></ellipse><circle cx="38" cy="18" r="15"></circle><circle cx="62" cy="20" r="12"></circle><circle cx="22" cy="21" r="11"></circle></g></svg>
          <svg viewBox="0 0 120 40" style={{ position: 'absolute', bottom: '30%', right: '22%', width: '96px', height: 'auto', animation: 'tidDriftB 16s ease-in-out infinite alternate' }}><g fill={cloudColor}><ellipse cx="40" cy="26" rx="38" ry="13"></ellipse><circle cx="38" cy="18" r="15"></circle><circle cx="62" cy="20" r="12"></circle><circle cx="22" cy="21" r="11"></circle></g></svg>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}` }}>ĐANG HỌC · BỘ THẺ</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px' }}>
              <h2 data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '25px', margin: '0', color: `${inkColor}` }}>IELTS · Chủ đề Môi trường</h2>
              <span style={{ background: '#E7EAD7', color: '#5D6B2D', fontSize: '12px', fontWeight: '800', padding: '4px 11px', borderRadius: '999px' }}>Academic</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button data-sk="panel" style={{ display: 'flex', alignItems: 'center', gap: '7px', background: `${searchBg}`, border: 'none', borderRadius: '12px', padding: '9px 14px', fontWeight: '700', fontSize: '13.5px', color: `${inkColor}`, cursor: 'pointer', transition: 'all .2s' }} data-hover={`${panelHover}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v6h6M21 21v-6h-6"></path><path d="M3 9a9 9 0 0 1 15-3l3 3M21 15a9 9 0 0 1-15 3l-3-3"></path></svg>
              Trộn thẻ
            </button>
            <button onClick={toggleAutoPlay} data-sk="panel" style={{ display: 'flex', alignItems: 'center', gap: '11px', background: `${searchBg}`, border: 'none', borderRadius: '12px', padding: '8px 14px', fontWeight: '700', fontSize: '13.5px', color: `${inkColor}`, cursor: 'pointer', transition: 'all .2s' }} data-hover={`${panelHover}`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"></path></svg>
              <span data-sk="ink" style={{ color: `${inkColor}` }}>Tự động phát âm</span>
              <span style={{ position: 'relative', width: '42px', height: '24px', borderRadius: '999px', background: `${autoTrackBg}`, transition: 'background .25s', flexShrink: '0' }}>
                <span style={{ position: 'absolute', top: '3px', left: `${autoKnobLeft}`, width: '18px', height: '18px', borderRadius: '50%', background: `${headerBg}`, boxShadow: '0 1px 3px rgba(0,0,0,.25)', transition: 'left .25s cubic-bezier(.3,.8,.4,1)' }}></span>
              </span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '26px', alignItems: 'flex-start', flexWrap: 'wrap', position: 'relative', zIndex: '1' }}>
          <div style={{ flex: '1 1 auto', minWidth: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '100%' }}>
              <div onClick={flip} style={{ position: 'relative', width: '100%', height: '358px', cursor: 'pointer', borderRadius: '28px', overflow: 'hidden' }}>

                <div style={{ position: 'absolute', inset: '0', borderRadius: '28px', background: `${cardFrontBg}`, border: `1px solid ${cardBorder}`, boxShadow: `${cardShadow}`, padding: '30px 34px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: '0', display: `${starsDisp}`, pointerEvents: 'none' }}>
                    { (cardStars)?.map?.((st, _index) => (<React.Fragment key={_index}>
                      <svg viewBox="0 0 24 24" style={{ position: 'absolute', top: `${st.top}`, left: `${st.left}`, width: `${st.size}`, height: `${st.size}`, animation: `tidTwinkle ${st.dur} ease-in-out ${st.delay} infinite` }}><path d="M12 0C12.7 6.4 17.6 11.3 24 12 17.6 12.7 12.7 17.6 12 24 11.3 17.6 6.4 12.7 0 12 6.4 11.3 11.3 6.4 12 0Z" fill="#EAF1FF"></path></svg>
                    </React.Fragment>)) }
                  </div>
                  <div style={{ position: 'absolute', bottom: '-90px', left: '-54px', width: '220px', height: '220px', borderRadius: '50%', background: '#F6A82C', display: `${sunBlobDisp}` }}></div>
                  <div style={{ position: 'absolute', bottom: '-58px', left: '-20px', width: '142px', height: '142px', borderRadius: '50%', background: `${headerBg}`, display: `${sunFaceDisp}`, alignItems: 'flex-start', justifyContent: 'center', paddingTop: '38px', animation: 'tidFloat 5s ease-in-out infinite' }}>
                    <svg width="82" height="46" viewBox="0 0 82 46"><circle cx="30" cy="15" r="4.4" fill="#1F1F1F"></circle><circle cx="54" cy="15" r="4.4" fill="#1F1F1F"></circle><path d="M28 27c4.5 6 22 6 26 0" stroke="#1F1F1F" strokeWidth="3.8" fill="none" strokeLinecap="round"></path></svg>
                  </div>
                  <div style={{ position: 'absolute', bottom: '-90px', left: '-54px', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,219,255,.45) 0%,rgba(160,190,250,.22) 42%,transparent 68%)', display: `${moonDisp}`, animation: 'tidHalo 5s ease-in-out infinite', pointerEvents: 'none' }}></div>
                  <div style={{ position: 'absolute', bottom: '-58px', left: '-20px', width: '142px', height: '142px', borderRadius: '50%', background: 'radial-gradient(circle at 38% 34%,#FCFDFF,#C4D4F2)', boxShadow: '0 0 40px 10px rgba(198,217,255,.5)', display: `${moonDisp}`, alignItems: 'flex-start', justifyContent: 'center', paddingTop: '38px', animation: 'tidFloat 5s ease-in-out infinite,tidMoonGlow 4s ease-in-out infinite', overflow: 'hidden' }}>
                    <span style={{ position: 'absolute', top: '18px', left: '30px', width: '13px', height: '13px', borderRadius: '50%', background: 'rgba(150,167,210,.4)' }}></span>
                    <span style={{ position: 'absolute', top: '60px', left: '18px', width: '9px', height: '9px', borderRadius: '50%', background: 'rgba(150,167,210,.34)' }}></span>
                    <span style={{ position: 'absolute', top: '40px', left: '58px', width: '7px', height: '7px', borderRadius: '50%', background: 'rgba(150,167,210,.3)' }}></span>
                    <svg width="82" height="46" viewBox="0 0 82 46" style={{ position: 'relative', zIndex: '1' }}><circle cx="30" cy="15" r="4.4" fill="#2B3A63"></circle><circle cx="54" cy="15" r="4.4" fill="#2B3A63"></circle><path d="M28 27c4.5 6 22 6 26 0" stroke="#2B3A63" strokeWidth="3.8" fill="none" strokeLinecap="round"></path></svg>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#2A3114', color: '#F6C453', fontWeight: '800', fontSize: '13px', padding: '6px 14px', borderRadius: '999px' }}>{ posVi }</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={speakBtn} style={{ width: '42px', height: '42px', borderRadius: '13px', border: 'none', background: '#F6C453', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 3px 0 #d6a531' }} data-hover="filter:brightness(1.05);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A3114" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"></path></svg>
                      </button>
                    </div>
                  </div>
                  <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '11px', position: 'relative' }}>
                    <h3 style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '62px', lineHeight: '1', letterSpacing: '-.02em', margin: '0', color: `${cardInk}` }}>{ word }</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: '\'Space Mono\',monospace', fontSize: '18px', color: `${cardSub}` }}>{ ipa }</span>
                      <button onClick={speakBtn} style={{ width: '30px', height: '30px', borderRadius: '9px', border: 'none', background: '#F6C453', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 0 #d6a531' }} data-hover="filter:brightness(1.05);">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2A3114" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7"></path></svg>
                      </button>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${cardChipBg}`, color: `${cardChipInk}`, fontWeight: '800', fontSize: '12.5px', padding: '5px 12px', borderRadius: '999px' }}>#{ tag }</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', position: 'relative' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', color: `${cardHint}`, fontWeight: '800', fontSize: '13.5px' }}>
                      Nhấn để xem nghĩa
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                    </span>
                  </div>
                </div>

                <div style={{ position: 'absolute', inset: '0', zIndex: '2', transform: `${meaningTransform}`, transition: 'transform .5s cubic-bezier(.3,.9,.3,1)', borderRadius: '28px', background: '#5D6B2D', backgroundImage: 'linear-gradient(155deg,#6A7A36,#46531F)', color: '#FFF8EB', border: '1px solid #3E4A1B', padding: '30px 34px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', bottom: '-50px', right: '-30px', width: '190px', height: '190px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(246,196,83,.22),transparent 70%)' }}></div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.14em', color: '#CBD3A6' }}>NGHĨA TIẾNG VIỆT</span>
                    <button onClick={speakBtn} style={{ width: '40px', height: '40px', borderRadius: '12px', border: 'none', background: '#F6C453', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 3px 0 #d6a531' }} data-hover="filter:brightness(1.05);">
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2A3114" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"></path></svg>
                    </button>
                  </div>
                  <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '18px', position: 'relative' }}>
                    <h3 style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '40px', lineHeight: '1.1', margin: '0', color: '#FFF8EB' }}>{ vi }</h3>
                    <div style={{ background: 'rgba(0,0,0,.16)', borderRadius: '16px', padding: '16px 18px', borderLeft: '4px solid #F6C453' }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.1em', color: '#CBD3A6', marginBottom: '7px' }}>VÍ DỤ</div>
                      <p style={{ margin: '0 0 6px', fontSize: '16.5px', fontWeight: '600', fontStyle: 'italic', color: '#FFF8EB', lineHeight: '1.4' }}>"{ exampleEn }"</p>
                      <p style={{ margin: '0', fontSize: '14.5px', color: '#C7CFA3', lineHeight: '1.4' }}>{ exampleVi }</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#CBD3A6' }}>Từ đồng nghĩa:</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#F6C453' }}>{ syn }</span>
                    </div>
                    <span style={{ color: '#A9B189', fontWeight: '700', fontSize: '13px' }}>↑ Nhấn để ẩn nghĩa</span>
                  </div>
                </div>

              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', width: '100%', maxWidth: '560px' }}>
              <button onClick={markUnknown} style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', height: '60px', borderRadius: '20px', border: '1.5px solid #E6CFC1', background: '#F7E7DE', color: '#A8482A', fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '16px', cursor: 'pointer', boxShadow: '0 5px 0 #E6CFC1' }} data-hover="background:#F4DCCE;" style-active="transform:translateY(2px);box-shadow:0 3px 0 #E6CFC1;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M9.2 9a2.8 2.8 0 0 1 5.4 1c0 1.9-2.8 2.8-2.8 2.8"></path><path d="M12 17h.01"></path></svg>
                Chưa nhớ
                <span style={{ fontSize: '12px', fontWeight: '800', lineHeight: '1', background: 'rgba(168,72,42,.14)', borderRadius: '7px', padding: '2px 7px' }}>1</span>
              </button>
              <button onClick={flip} style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '60px', padding: '0 28px', borderRadius: '20px', border: 'none', background: '#5D6B2D', color: '#FFF8EB', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '17px', cursor: 'pointer', boxShadow: '0 5px 0 #3E4A1B', flexShrink: '0' }} data-hover="background:#697A35;" style-active="transform:translateY(2px);box-shadow:0 3px 0 #3E4A1B;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6a2 2 0 0 0 2 2h11l4 4V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z"></path><path d="M8 9h8M8 12h5"></path></svg>
                Lật thẻ
                <span style={{ fontSize: '11px', fontWeight: '700', background: 'rgba(255,255,255,.16)', borderRadius: '7px', padding: '2px 7px' }}>Space</span>
              </button>
              <button onClick={markKnown} style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', height: '60px', borderRadius: '20px', border: '1.5px solid #CBD79F', background: '#EEF1E2', color: '#46591F', fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '16px', cursor: 'pointer', boxShadow: '0 5px 0 #CBD79F' }} data-hover="background:#E5EBCF;" style-active="transform:translateY(2px);box-shadow:0 3px 0 #CBD79F;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                Đã nhớ
                <span style={{ fontSize: '12px', fontWeight: '800', lineHeight: '1', background: 'rgba(70,89,31,.14)', borderRadius: '7px', padding: '2px 7px' }}>2</span>
              </button>
            </div>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px', flexShrink: '0' }}>
                <span data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '18px', color: `${inkColor}` }}>Thẻ { human }</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: `${titleColor}` }}>/ { total }</span>
              </div>
              <div data-sk="track" style={{ flex: '1', height: '12px', borderRadius: '7px', background: '${nightCardBorder}', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressW}`, borderRadius: '7px', background: 'linear-gradient(90deg,#F6C453,#EE9A23)', transition: 'width .5s cubic-bezier(.2,.8,.3,1)' }}></div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#9a5a14', flexShrink: '0' }}>{ progressW }</span>
            </div>
          </div>
          <div style={{ display: 'none' }}>

            <div data-sk="railnight" style={{ position: 'relative', flex: '1', background: '#5D6B2D', backgroundImage: 'linear-gradient(150deg,#6A7A36,#46531F)', borderRadius: '20px', padding: '18px 18px', color: '#FFF8EB', overflow: 'hidden', boxShadow: '0 14px 30px -18px rgba(46,53,20,.6)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div aria-hidden="true" style={{ position: 'absolute', inset: '0', display: `${starsDisp}`, pointerEvents: 'none' }}>
                { (cardStars)?.map?.((st, _index) => (<React.Fragment key={_index}>
                  <svg viewBox="0 0 24 24" style={{ position: 'absolute', top: `${st.top}`, left: `${st.left}`, width: `${st.size}`, height: `${st.size}`, animation: `tidTwinkle ${st.dur} ease-in-out ${st.delay} infinite` }}><path d="M12 0C12.7 6.4 17.6 11.3 24 12 17.6 12.7 12.7 17.6 12 24 11.3 17.6 6.4 12.7 0 12 6.4 11.3 11.3 6.4 12 0Z" fill="#EAF1FF"></path></svg>
                </React.Fragment>)) }
              </div>
              <div style={{ position: 'absolute', top: '-34px', right: '-24px', width: '96px', height: '96px', borderRadius: '50%', background: '#F6A82C', display: `${sunBlobDisp}` }}></div>
              <div style={{ position: 'absolute', top: '-20px', right: '-10px', width: '62px', height: '62px', borderRadius: '50%', background: '#F6C453', display: `${sunFaceDisp}`, alignItems: 'end', justifyContent: 'center', animation: 'tidFloat 4s ease-in-out infinite' }}>
                <svg width="44" height="32" viewBox="0 0 58 44"><circle cx="22" cy="14" r="3.4" fill="#1F1F1F"></circle><circle cx="38" cy="14" r="3.4" fill="#1F1F1F"></circle><path d="M20 24c3 4 15 4 18 0" stroke="#1F1F1F" strokeWidth="3" fill="none" strokeLinecap="round"></path></svg>
              </div>
              <div style={{ position: 'absolute', top: '-40px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,219,255,.4) 0%,rgba(160,190,250,.18) 44%,transparent 68%)', display: `${moonDisp}`, animation: 'tidHalo 5s ease-in-out infinite', pointerEvents: 'none' }}></div>
              <div style={{ position: 'absolute', top: '-20px', right: '-10px', width: '62px', height: '62px', borderRadius: '50%', background: 'radial-gradient(circle at 38% 34%,#FCFDFF,#C4D4F2)', boxShadow: '0 0 24px 6px rgba(198,217,255,.5)', display: `${moonDisp}`, alignItems: 'end', justifyContent: 'center', animation: 'tidFloat 4s ease-in-out infinite,tidMoonGlow 4s ease-in-out infinite', overflow: 'hidden' }}>
                <span style={{ position: 'absolute', top: '12px', left: '14px', width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(150,167,210,.4)' }}></span>
                <svg width="44" height="32" viewBox="0 0 58 44" style={{ position: 'relative', zIndex: '1' }}><circle cx="22" cy="14" r="3.4" fill="#2B3A63"></circle><circle cx="38" cy="14" r="3.4" fill="#2B3A63"></circle><path d="M20 24c3 4 15 4 18 0" stroke="#2B3A63" strokeWidth="3" fill="none" strokeLinecap="round"></path></svg>
              </div>
              <div style={{ position: 'relative', maxWidth: '188px' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '.12em', color: '#CBD3A6' }}>TID ĐỒNG HÀNH</div>
                <p style={{ margin: '6px 0 11px', fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '15px', lineHeight: '1.3' }}>Bứt phá giới hạn hôm nay nhé! 🌱</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(0,0,0,.2)', borderRadius: '10px', padding: '6px 11px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#CBD3A6' }}>Còn lại</span>
                  <span style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '14px', color: '#F6C453' }}>3 thẻ</span>
                </div>
              </div>
            </div>

            <div data-sk="railnight" style={{ position: 'relative', overflow: 'hidden', flex: '1', background: `${headerBg}`, border: '1px solid #EFE7D2', borderRadius: '20px', padding: '18px 18px', boxShadow: '0 8px 24px -16px rgba(46,53,20,.3)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div aria-hidden="true" style={{ position: 'absolute', inset: '0', display: `${starsDisp}`, pointerEvents: 'none' }}>
                { (cardStars)?.map?.((st, _index) => (<React.Fragment key={_index}>
                  <svg viewBox="0 0 24 24" style={{ position: 'absolute', top: `${st.top}`, left: `${st.left}`, width: `${st.size}`, height: `${st.size}`, animation: `tidTwinkle ${st.dur} ease-in-out ${st.delay} infinite` }}><path d="M12 0C12.7 6.4 17.6 11.3 24 12 17.6 12.7 12.7 17.6 12 24 11.3 17.6 6.4 12.7 0 12 6.4 11.3 11.3 6.4 12 0Z" fill="#EAF1FF"></path></svg>
                </React.Fragment>)) }
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '11px', position: 'relative' }}>
                <span data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '15px', color: `${inkColor}` }}>Mức độ thành thạo</span>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#9a5a14', background: '#FFF3D6', padding: '3px 9px', borderRadius: '999px' }}>Cấp 4</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '13px', position: 'relative', zIndex: '1' }}>
                <div style={{ position: 'relative', width: '58px', height: '58px', flexShrink: '0' }}>
                  <svg width="58" height="58" viewBox="0 0 58 58" style={{ transform: 'rotate(-90deg)' }}><circle cx="29" cy="29" r="24" fill="none" stroke="${nightCardBorder}" strokeWidth="7"></circle><circle cx="29" cy="29" r="24" fill="none" stroke="#5D6B2D" strokeWidth="7" strokeLinecap="round" strokeDasharray="150.8" strokeDashoffset="48.3"></circle></svg>
                  <div style={{ position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '15px', color: '#5D6B2D' }}>68%</div>
                </div>
                <div style={{ flex: '1' }}>
                  <p data-sk="ink2" style={{ margin: '0 0 8px', fontSize: '12.5px', fontWeight: '600', color: `${ink2Color}`, lineHeight: '1.4' }}>Bạn đã thuộc <b data-sk="ink" style={{ color: `${inkColor}` }}>34/50</b> từ trong bộ này.</p>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ flex: '1', height: '6px', borderRadius: '4px', background: '#5D6B2D' }}></span>
                    <span style={{ flex: '1', height: '6px', borderRadius: '4px', background: '#5D6B2D' }}></span>
                    <span style={{ flex: '1', height: '6px', borderRadius: '4px', background: '#5D6B2D' }}></span>
                    <span style={{ flex: '1', height: '6px', borderRadius: '4px', background: '#F6C453' }}></span>
                    <span data-sk="track" style={{ flex: '1', height: '6px', borderRadius: '4px', background: '${nightCardBorder}' }}></span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
        <div>
          <div data-sk="seclabel" style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}`, marginBottom: '11px' }}>CHẾ ĐỘ LUYỆN TẬP</div>
          <div style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px', position: 'relative' }}>
            <button onClick={startQuiz} data-sk="pm-quiz" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start', textAlign: 'left', background: '#DB8A2E', border: '1px solid #c2741f', borderRadius: '18px', padding: '16px', cursor: 'pointer', position: 'relative', overflow: 'hidden', isolation: 'isolate' }} data-hover="transform:translateY(-3px);box-shadow:0 12px 22px -12px rgba(219,138,46,.7);">
              <div style={{ position: 'absolute', right: '-22px', bottom: '-26px', width: '92px', height: '92px', borderRadius: '50%', background: 'rgba(255,255,255,.15)', zIndex: '-1' }}></div>
              <div style={{ position: 'absolute', right: '-40px', bottom: '6px', width: '128px', height: '38px', borderRadius: '50%', border: '6px solid rgba(255,255,255,.18)', transform: 'rotate(-20deg)', zIndex: '-1' }}></div>
              <span style={{ width: '42px', height: '42px', borderRadius: '13px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 0 rgba(0,0,0,.14)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C16A12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path><rect x="9" y="3" width="6" height="4" rx="1"></rect><path d="m9 14 2 2 4-4"></path></svg>
              </span>
              <span style={{ fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '15px', color: '#FFFFFF' }}>Quiz</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,.82)' }}>Trắc nghiệm nhanh</span>
            </button>
            <button onClick={startListening} data-sk="pm-listen" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start', textAlign: 'left', background: '#2C8A70', border: '1px solid #20705a', borderRadius: '18px', padding: '16px', cursor: 'pointer', position: 'relative', overflow: 'hidden', isolation: 'isolate' }} data-hover="transform:translateY(-3px);box-shadow:0 12px 22px -12px rgba(44,138,112,.7);">
              <div style={{ position: 'absolute', right: '-24px', bottom: '-28px', width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(255,255,255,.14)', zIndex: '-1' }}></div>
              <div style={{ position: 'absolute', right: '14px', bottom: '34px', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,.2)', zIndex: '-1' }}></div>
              <span style={{ width: '42px', height: '42px', borderRadius: '13px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 0 rgba(0,0,0,.14)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F6B55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14v-2a9 9 0 0 1 18 0v2"></path><path d="M21 16a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2ZM3 16a2 2 0 0 0 2 2h1v-5H5a2 2 0 0 0-2 2Z"></path></svg>
              </span>
              <span style={{ fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '15px', color: '#FFFFFF' }}>Listening</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,.82)' }}>Nghe và gõ lại</span>
            </button>
            <button onClick={startBlank} data-sk="pm-blank" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start', textAlign: 'left', background: '#C95F50', border: '1px solid #ad4a3d', borderRadius: '18px', padding: '16px', cursor: 'pointer', position: 'relative', overflow: 'hidden', isolation: 'isolate' }} data-hover="transform:translateY(-3px);box-shadow:0 12px 22px -12px rgba(201,95,80,.7);">
              <div style={{ position: 'absolute', right: '-26px', bottom: '-30px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,.15)', zIndex: '-1' }}></div>
              <div style={{ position: 'absolute', right: '8px', bottom: '16px', width: '30px', height: '14px', borderRadius: '50%', background: 'rgba(255,255,255,.18)', transform: 'rotate(-18deg)', zIndex: '-1' }}></div>
              <span style={{ width: '42px', height: '42px', borderRadius: '13px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 0 rgba(0,0,0,.14)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A8483B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2"></path><path d="M9 20h6"></path><path d="M12 4v16"></path><rect x="3" y="11" width="8" height="5" rx="1.2" strokeDasharray="1.6 1.8"></rect></svg>
              </span>
              <span style={{ fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '15px', color: '#FFFFFF' }}>Điền vào chỗ trống</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,.82)' }}>Chọn từ điền câu</span>
            </button>
            <button onClick={startTidians} data-sk="pm-tidians" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start', textAlign: 'left', background: '#8C5CB8', border: '1px solid #6E429A', borderRadius: '18px', padding: '16px', cursor: 'pointer', position: 'relative', overflow: 'hidden', isolation: 'isolate' }} data-hover="transform:translateY(-3px);box-shadow:0 12px 22px -12px rgba(140,92,184,.7);">
              <div style={{ position: 'absolute', right: '-24px', bottom: '-28px', width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(255,255,255,.14)', zIndex: '-1' }}></div>
              <div style={{ position: 'absolute', right: '-42px', bottom: '8px', width: '130px', height: '36px', borderRadius: '50%', border: '5px solid rgba(255,255,255,.18)', transform: 'rotate(-22deg)', zIndex: '-1' }}></div>
              <span style={{ width: '42px', height: '42px', borderRadius: '13px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 0 rgba(0,0,0,.14)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6E429A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10a7 7 0 0 1-14 0M12 17v4"></path></svg>
              </span>
              <span style={{ fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '15px', color: '#FFFFFF' }}>Tidians</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,.82)' }}>Đặt câu &amp; luyện nói</span>
            </button>
            <button onClick={startMixed} data-sk="pm-mixed" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start', textAlign: 'left', background: '#C95B9C', border: '1px solid #aa4181', borderRadius: '18px', padding: '16px', cursor: 'pointer', position: 'relative', overflow: 'hidden', isolation: 'isolate' }} data-hover="transform:translateY(-3px);box-shadow:0 12px 22px -12px rgba(201,91,156,.7);">
              <div style={{ position: 'absolute', right: '-22px', bottom: '-26px', width: '92px', height: '92px', borderRadius: '50%', background: 'rgba(255,255,255,.15)', zIndex: '-1' }}></div>
              <div style={{ position: 'absolute', right: '-40px', bottom: '6px', width: '126px', height: '36px', borderRadius: '50%', border: '5px solid rgba(255,255,255,.18)', transform: 'rotate(-20deg)', zIndex: '-1' }}></div>
              <span style={{ width: '42px', height: '42px', borderRadius: '13px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 0 rgba(0,0,0,.14)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A8417E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 9 5-9 5-9-5 9-5Z"></path><path d="m3 12 9 5 9-5M3 17l9 5 9-5"></path></svg>
              </span>
              <span style={{ fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '15px', color: '#FFFFFF' }}>Tổng hợp</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,.82)' }}>Nhiều chế độ</span>
            </button>
          </div>
          </div>
        </div>
        </React.Fragment>) : null }
        { (isStats) ? (<React.Fragment>
        <div style={{ position: 'relative', zIndex: '1', display: 'flex', flexDirection: 'column', gap: '22px', animation: 'tidRise .4s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}` }}>THỐNG KÊ · HÀNH TRÌNH TỪ VỰNG</div>
              <h2 data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '26px', margin: '5px 0 0', color: `${inkColor}` }}>Tiến độ học tập của bạn</h2>
            </div>
            <div data-sk="panel" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: `${headerBg}`, border: '1px solid #EFE7D2', borderRadius: '14px', padding: '8px 14px' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="#EE9A23"><path d="M12 2c1 3-1 4-1 6 2-1 3 1 4 2 2 2 2 5 0 7a6 6 0 0 1-9-1c-1-2 0-4 1-5 0 2 1 3 2 3-1-2 0-4 1-5 1 2 2 1 2-1 1-2 0-4-2-6Z"></path></svg>
              <span data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '15px', color: `${inkColor}` }}>Chuỗi { dashStreak || 0 } ngày</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
            <div data-sk="panel" style={{ background: `${headerBg}`, border: '1px solid #EFE7D2', borderRadius: '20px', padding: '20px', boxShadow: '0 10px 30px -20px rgba(46,53,20,.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ width: '36px', height: '36px', borderRadius: '11px', background: '#FFF3D6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#9a5a14" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg></span>
                <span data-sk="ink2" style={{ fontSize: '12.5px', fontWeight: '700', color: '#a8835a' }}>Từ đã thêm</span>
              </div>
              <div data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '34px', lineHeight: '1', color: `${inkColor}` }}>{ totalAdded }</div>
            </div>
            <div data-sk="panel" style={{ background: `${headerBg}`, border: '1px solid #EFE7D2', borderRadius: '20px', padding: '20px', boxShadow: '0 10px 30px -20px rgba(46,53,20,.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ width: '36px', height: '36px', borderRadius: '11px', background: '#EEF1E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#5D6B2D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg></span>
                <span data-sk="ink2" style={{ fontSize: '12.5px', fontWeight: '700', color: '#7c8362' }}>Đã nhớ</span>
              </div>
              <div data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '34px', lineHeight: '1', color: `${inkColor}` }}>{ totalLearned }</div>
            </div>
            <div data-sk="panel" style={{ background: `${headerBg}`, border: '1px solid #EFE7D2', borderRadius: '20px', padding: '20px', boxShadow: '0 10px 30px -20px rgba(46,53,20,.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ width: '36px', height: '36px', borderRadius: '11px', background: '#F9E6CF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#C2693B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v6h6"></path><path d="M3 9a9 9 0 1 0 3-6.7L3 9"></path></svg></span>
                <span data-sk="ink2" style={{ fontSize: '12.5px', fontWeight: '700', color: '#b07d5a' }}>Cần ôn lại</span>
              </div>
              <div data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '34px', lineHeight: '1', color: `${inkColor}` }}>{ totalReview }</div>
            </div>
            <div data-sk="panel" style={{ background: `${headerBg}`, border: '1px solid #EFE7D2', borderRadius: '20px', padding: '20px', boxShadow: '0 10px 30px -20px rgba(46,53,20,.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ width: '36px', height: '36px', borderRadius: '11px', background: '#E7EEF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#3A6387" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M6 20v-4M18 20V8M4 4h16"></path></svg></span>
                <span data-sk="ink2" style={{ fontSize: '12.5px', fontWeight: '700', color: '#6a8298' }}>Độ chính xác</span>
              </div>
              <div data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '34px', lineHeight: '1', color: `${inkColor}` }}>{ accuracy }</div>
            </div>
          </div>

          <div data-sk="panel" style={{ background: `${headerBg}`, border: '1px solid #EFE7D2', borderRadius: '24px', padding: '26px', boxShadow: '0 10px 30px -20px rgba(46,53,20,.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '18px', margin: '0', color: `${inkColor}` }}>Từ vựng mỗi ngày · 7 ngày qua</h3>
                <p data-sk="ink2" style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: '500', color: `${manifestSub}` }}>Số từ bạn thêm và học mỗi ngày trong tuần này</p>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span data-sk="ink2" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '700', color: '#5D6B2D' }}><span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#5D6B2D' }}></span>Đã nhớ</span>
                <span data-sk="ink2" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '700', color: '#9a5a14' }}><span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#F6C453' }}></span>Cần ôn</span>
              </div>
            </div>
            <div data-sk="chartgrid" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '18px', height: '300px', padding: '18px 8px 0', borderTop: '1px dashed #E4DEC9' }}>
              { (bars)?.map?.((b, _index) => (<React.Fragment key={_index}>
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '11px', height: '100%', justifyContent: 'flex-end' }}>
                  <span data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '13px', color: `${inkColor}` }}>{ b.added }</span>
                  <div style={{ width: '100%', maxWidth: '54px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', height: `${b.reviewH}`, background: 'linear-gradient(180deg,#FBD56A,#F6C453)', borderRadius: '10px 10px 0 0', transition: 'height .6s cubic-bezier(.2,.8,.3,1)' }}></div>
                    <div style={{ width: '100%', height: `${b.learnedH}`, background: 'linear-gradient(180deg,#6A7A36,#46531F)', borderRadius: '0 0 10px 10px', transition: 'height .6s cubic-bezier(.2,.8,.3,1)' }}></div>
                  </div>
                  <span data-sk="ink2" style={{ fontSize: '12.5px', fontWeight: '700', color: `${titleColor}` }}>{ b.day }</span>
                </div>
              </React.Fragment>)) }
            </div>
          </div>
        </div>
        </React.Fragment>) : null }
        { (isLists) ? (<React.Fragment>
        <div style={{ position: 'relative', zIndex: '1', display: 'flex', flexDirection: 'column', gap: '22px', animation: 'tidRise .42s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}` }}>DANH SÁCH TỪ VỰNG</div>
              <h2 data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '26px', margin: '5px 0 0', color: `${inkColor}` }}>{ listTitle }</h2>
              <p data-sk="ink2" style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: '500', color: `${manifestSub}` }}>{ listDesc }</p>
            </div>
          </div>
          { (listHasRows) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.1em', color: `${titleColor}` }}>HỌC LẠI VỚI CHẾ ĐỘ</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={listStudyFlashcard} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: `${listAccent}`, border: 'none', borderRadius: '13px', padding: '11px 17px', fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '14px', color: '#fff', cursor: 'pointer', boxShadow: '0 3px 0 rgba(0,0,0,.18)' }} data-hover="filter:brightness(1.06);">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6a2 2 0 0 0 2 2h11l4 4V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z"></path><path d="M8 9h8M8 12h5"></path></svg>
                  Flashcard
                </button>
                <button onClick={listStudyQuiz} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#E08A2C', border: 'none', borderRadius: '13px', padding: '11px 17px', fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '14px', color: '#fff', cursor: 'pointer', boxShadow: '0 3px 0 rgba(0,0,0,.18)' }} data-hover="filter:brightness(1.06);">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="3" width="8" height="4" rx="1"></rect><path d="M5 5h2M17 5h2v16H5V5h2"></path><path d="M9 13l2 2 4-4"></path></svg>
                  Quiz
                </button>
                <button onClick={listStudyListening} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2E9D7E', border: 'none', borderRadius: '13px', padding: '11px 17px', fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '14px', color: '#fff', cursor: 'pointer', boxShadow: '0 3px 0 rgba(0,0,0,.18)' }} data-hover="filter:brightness(1.06);">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14v-2a9 9 0 0 1 18 0v2"></path><path d="M4 14h3v6H5a1 1 0 0 1-1-1v-5zM20 14h-3v6h2a1 1 0 0 0 1-1v-5z"></path></svg>
                  Listening
                </button>
                <button onClick={listStudyBlank} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#C95F50', border: 'none', borderRadius: '13px', padding: '11px 17px', fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '14px', color: '#fff', cursor: 'pointer', boxShadow: '0 3px 0 rgba(0,0,0,.18)' }} data-hover="filter:brightness(1.06);">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V5h16v2M9 5v14M7 19h4"></path></svg>
                  Điền vào chỗ trống
                </button>
                <button onClick={listStudyMixed} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#B0457F', border: 'none', borderRadius: '13px', padding: '11px 17px', fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '14px', color: '#fff', cursor: 'pointer', boxShadow: '0 3px 0 rgba(0,0,0,.18)' }} data-hover="filter:brightness(1.06);">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                  Tổng hợp
                </button>
              </div>
            </div>
          ) : null }

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={goKnownTab} data-sk="seg" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: `${tabKnownBg}`, color: `${tabKnownInk}`, border: '1px solid ${nightCardBorder}', borderRadius: '13px', padding: '10px 16px', fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }} data-hover="filter:brightness(1.03);">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><path d="M22 4 12 14.01l-3-3"></path></svg>
              Đã nhớ <span style={{ opacity: '.7' }}>{ knownCount }</span>
            </button>
            <button onClick={goUnknownTab} data-sk="seg" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: `${tabUnknownBg}`, color: `${tabUnknownInk}`, border: '1px solid ${nightCardBorder}', borderRadius: '13px', padding: '10px 16px', fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }} data-hover="filter:brightness(1.03);">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
              Chưa nhớ <span style={{ opacity: '.7' }}>{ unknownCount }</span>
            </button>
            <button onClick={goReviewTab} data-sk="seg" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: `${tabReviewBg}`, color: `${tabReviewInk}`, border: '1px solid ${nightCardBorder}', borderRadius: '13px', padding: '10px 16px', fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }} data-hover="filter:brightness(1.03);">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18M21 21H3"></path><path d="M7 16l4-5 3 3 4-6"></path></svg>
              Cần ôn tập <span style={{ opacity: '.7' }}>{ reviewBadge }</span>
            </button>
          </div>

          <div data-sk="panel" style={{ background: `${headerBg}`, border: `1px solid ${listBorder}`, borderRadius: '24px', boxShadow: `${nightCardShadow}`, overflow: 'hidden' }}>
            { (listEmpty) ? (<React.Fragment>
              <div style={{ textAlign: 'center', padding: '64px 20px', color: `${titleColor}` }}>
                <div style={{ fontSize: '42px', marginBottom: '12px' }}>🗂️</div>
                <p data-sk="ink" style={{ margin: '0', fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '17px', color: `${inkColor}` }}>Chưa có từ nào ở đây</p>
                <p style={{ margin: '6px 0 0', fontSize: '14px', fontWeight: '500' }}>Trong khi học, bấm "Đã nhớ" hoặc "Chưa nhớ" để phân loại từ vựng.</p>
              </div>
            </React.Fragment>) : null }
            { (listHasRows) ? (<React.Fragment>
              <div data-sk="seg" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.4fr auto', gap: '0', padding: '15px 28px', background: `${listHeaderBg}`, borderBottom: `1px solid ${listBorder}` }}>
                <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}` }}>TỪ VỰNG</span>
                <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}` }}>NGHĨA</span>
                <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}`, textAlign: 'right' }}>LOẠI TỪ</span>
              </div>
              { (listRows)?.map?.((kt, _index) => (<React.Fragment key={_index}>
                <button onClick={kt.go} data-sk="listrow" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.4fr auto', alignItems: 'center', gap: '0', background: 'transparent', border: 'none', borderBottom: `1px solid ${dividerColor}`, padding: '16px 28px', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit' }} data-hover={`${listHover}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '0' }}>
                    <span onClick={kt.speak} style={{ width: '32px', height: '32px', borderRadius: '10px', background: `${listBtnBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }} data-hover="background:#F6C453;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={`${listBtnInk}`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7"></path></svg>
                    </span>
                    <div style={{ minWidth: '0' }}>
                      <div data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '17px', color: `${inkColor}` }}>{ kt.word }</div>
                      <div style={{ fontFamily: '\'Space Mono\',monospace', fontSize: '12px', color: `${titleColor}` }}>{ kt.ipa }</div>
                    </div>
                  </div>
                  <span data-sk="ink2" style={{ fontSize: '14.5px', fontWeight: '600', color: `${ink2Color}` }}>{ kt.vi }</span>
                  <span style={{ justifySelf: 'end', minWidth: '42px', textAlign: 'center', background: `${listBtnBg}`, color: `${listBtnInk}`, fontFamily: '\'Nunito\'', fontSize: '11.5px', fontWeight: '900', padding: '6px 10px', borderRadius: '9px' }}>{ kt.pos }</span>
                </button>
              </React.Fragment>)) }
            </React.Fragment>) : null }
          </div>
        </div>
        </React.Fragment>) : null }
        { (isSets) ? (<React.Fragment>
        <div style={{ position: 'relative', zIndex: '1', display: 'flex', flexDirection: 'column', gap: '22px', animation: 'tidRise .4s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}` }}>BỘ TỪ VỰNG · IELTS</div>
              <h2 data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '26px', margin: '5px 0 0', color: `${inkColor}` }}>Chọn bộ từ để bắt đầu học</h2>
            </div>
            <div data-sk="panel" style={{ display: 'flex', alignItems: 'center', gap: '9px', background: `${headerBg}`, border: '1px solid #EFE7D2', borderRadius: '14px', padding: '9px 14px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5D6B2D' }}></span>
              <span data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '14px', color: `${inkColor}` }}>{ setsSummary }</span>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gridAutoRows: '202px', gap: '18px', position: 'relative' }}>
            { (setCards)?.map?.((sc, _index) => (<React.Fragment key={_index}>
              <button onClick={sc.open} style={{ gridColumn: sc.grid ? "span 2" : "span 1", position: 'relative', overflow: 'hidden', border: 'none', borderRadius: '26px', background: sc.color, color: '#FFF8EB', cursor: 'pointer', textAlign: 'left', padding: '24px 26px', display: 'flex', flexDirection: 'column', isolation: 'isolate', transition: 'transform .25s cubic-bezier(.2,.8,.3,1),box-shadow .25s ease' }} data-hover="transform:translateY(-5px);box-shadow:0 26px 46px -22px rgba(31,31,20,.5);">
                <div style={{ position: 'absolute', inset: '0', zIndex: '-1', background: sc.pattern }}></div>
                <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(160deg,rgba(255,255,255,.12),transparent 46%)', zIndex: '-1' }}></div>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', position: 'relative' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,248,235,.92)', letterSpacing: '.01em' }}>{ sc.kicker } · { sc.count } từ</span>
                  <span style={{ position: 'relative', width: '50px', height: '50px', flexShrink: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: '0', width: '100%', height: '100%', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,.16))' }}><g fill="#FFF8EB"><circle cx="50" cy="50" r="31"></circle><circle cx="78" cy="50" r="8"></circle><circle cx="74.2" cy="64" r="8"></circle><circle cx="64" cy="74.2" r="8"></circle><circle cx="50" cy="78" r="8"></circle><circle cx="36" cy="74.2" r="8"></circle><circle cx="25.8" cy="64" r="8"></circle><circle cx="22" cy="50" r="8"></circle><circle cx="25.8" cy="36" r="8"></circle><circle cx="36" cy="25.8" r="8"></circle><circle cx="50" cy="22" r="8"></circle><circle cx="64" cy="25.8" r="8"></circle><circle cx="74.2" cy="36" r="8"></circle></g></svg>
                    <span style={{ position: 'relative', fontSize: '19px', lineHeight: '1' }}>{ sc.icon }</span>
                  </span>
                </div>

                <div style={{ marginTop: 'auto', position: 'relative' }}>
                  <h3 style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: `${sc.headSize}`, margin: '0 0 7px', lineHeight: '1.04', letterSpacing: '-.01em' }}>{ sc.label }</h3>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: '500', color: 'rgba(255,248,235,.9)', lineHeight: '1.45', maxWidth: '380px' }}>{ sc.desc }</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '15px', flexWrap: 'wrap' }}>
                    <span style={{ display: `${sc.statsDisp}`, alignItems: 'center', gap: '6px', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '15px' }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="#FFF8EB"><path d="m12 2 3 6.5 7 .8-5.2 4.8 1.5 7L12 18l-6.8 4 1.5-7L1.5 9.3l7-.8L12 2Z"></path></svg>{ sc.rating }
                    </span>
                    <span style={{ display: `${sc.statsDisp}`, alignItems: 'center', gap: '6px', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '15px' }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="rgba(255,248,235,.95)"><circle cx="12" cy="12" r="10"></circle><path d="M17 9l-5.5 6L7 11.5" fill="none" stroke={sc.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path></svg>{ sc.masteryPct } đạt
                    </span>
                    <span style={{ display: `${sc.personalDisp}`, alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,.18)', borderRadius: '999px', padding: '5px 12px', fontSize: '12px', fontWeight: '800' }}>＋ Thêm từ của bạn</span>
                    <span style={{ display: `${sc.currentDisp}`, alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,.18)', borderRadius: '999px', padding: '5px 12px', fontSize: '12px', fontWeight: '800' }}>● Đang học</span>
                  </div>
                </div>
              </button>
            </React.Fragment>)) }
          </div>
          </div>
        </div>
        </React.Fragment>) : null }
        { (isPersonal) ? (<React.Fragment>
        <div style={{ position: 'relative', zIndex: '1', display: 'flex', flexDirection: 'column', gap: '22px', animation: 'tidRise .4s ease both' }}>
          <div>
            <button onClick={goSets} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', fontSize: '13px', color: '#a8835a', padding: '0', marginBottom: '10px' }} data-hover="color:#C2693B;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
              Tất cả bộ từ
            </button>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ width: '52px', height: '52px', borderRadius: '15px', background: '#5D6B2D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 5px 0 #46531F' }}>✏️</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}` }}>BỘ TỪ CỦA BẢN THÂN</div>
                  <h2 data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '26px', margin: '3px 0 0', color: `${inkColor}` }}>Thư mục của bạn</h2>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={openImportModal} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${headerBg}`, border: '1px solid #D9CDB5', borderRadius: '14px', padding: '12px 16px', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '14px', color: '#5D6B2D', cursor: 'pointer' }} data-hover="background:#FBF8EF;border-color:#5D6B2D;">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M8 11l4 4 4-4"></path><path d="M5 21h14a0 0 0 0 1 0 0v-3a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3a0 0 0 0 1 0 0Z"></path></svg>
                  Import từ vựng
                </button>
                <button onClick={createNewFolder} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#5D6B2D', border: 'none', borderRadius: '14px', padding: '12px 18px', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '14px', color: '#FFF8EB', cursor: 'pointer', boxShadow: '0 4px 0 #3E4A1B' }} data-hover="background:#697A35;">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
                  Tạo thư mục mới
                </button>
              </div>
            </div>
          </div>

          <div data-sk="panel" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: `${headerBg}`, border: `1px solid ${panelBorder}`, borderRadius: '16px', padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#5D6B2D' }}></span><span data-sk="ink2" style={{ fontSize: '13.5px', fontWeight: '700', color: `${ink2Color}` }}>{ personalFolderCount } thư mục</span></div>
            <span style={{ color: `${panelBorder}` }}>·</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#E08A2C' }}></span><span data-sk="ink2" style={{ fontSize: '13.5px', fontWeight: '700', color: `${ink2Color}` }}>{ personalTotal } từ vựng tự thêm</span></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px' }}>
            { (personalFolders)?.map?.((pf, _index) => (<React.Fragment key={_index}>
              <button onClick={pf.open} data-sk="panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: `${headerBg}`, border: `1px solid ${panelBorder}`, borderRadius: '20px', padding: '18px 20px', cursor: 'pointer', textAlign: 'left', boxShadow: '0 10px 28px -20px rgba(0,0,0,.6)', transition: 'transform .2s ease,box-shadow .2s ease' }} data-hover="transform:translateY(-3px);box-shadow:0 18px 34px -20px rgba(0,0,0,.65);">
                <span style={{ width: '50px', height: '50px', borderRadius: '15px', background: `${pf.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0', boxShadow: `0 4px 0 ${pf.deep}` }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF8EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"></path></svg>
                </span>
                <div style={{ flex: '1', minWidth: '0' }}>
                  <h3 data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '16.5px', margin: '0', color: `${inkColor}`, lineHeight: '1.2' }}>{ pf.name }</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', fontWeight: '700', color: '#a8835a' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2.5"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg>
                      Đã thêm { pf.date }
                    </span>
                  </div>
                </div>
                <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '1px', flexShrink: '0', background: '#FFF8EB', border: '1px solid #EFE7D2', borderRadius: '12px', padding: '7px 12px' }}>
                  <span style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '18px', color: '#5D6B2D', lineHeight: '1' }}>{ pf.count }</span>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#7E875F' }}>từ</span>
                </span>
              </button>
            </React.Fragment>)) }
            <button onClick={createNewFolder} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '11px', background: 'transparent', border: `2px dashed ${panelBorder}`, borderRadius: '20px', padding: '18px 20px', cursor: 'pointer', minHeight: '90px', color: '#a8835a', fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '15px' }} data-hover="border-color:#5D6B2D;color:#5D6B2D;background:rgba(93,107,45,.04);">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
              Thư mục mới
            </button>
          </div>
        </div>
        </React.Fragment>) : null }

        { (isFolderDetail) ? (<React.Fragment>
        <div style={{ position: 'relative', zIndex: '1', display: 'flex', flexDirection: 'column', gap: '22px', animation: 'tidRise .4s ease both' }}>
          {/* Header row */}
          <div>
            <button onClick={goBackToPersonal} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', fontSize: '13px', color: '#a8835a', padding: '0', marginBottom: '10px' }} data-hover="color:#C2693B;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
              Thư mục của bạn
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ width: '52px', height: '52px', borderRadius: '15px', background: `${folderDetailColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 5px 0 ${folderDetailDeep}` }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFF8EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"></path></svg>
                </span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '.12em', color: `${titleColor}` }}>BỘ TỪ CỦA BẢN THÂN</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    <h2 data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '26px', margin: '0', color: `${inkColor}` }}>{ folderDetailName }</h2>
                    {startRenameFolderDetail && (
                      <button onClick={startRenameFolderDetail} title="Đổi tên" style={{ background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: '8px', padding: '5px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: `${ink2Color}` }} data-hover="background:rgba(255,255,255,.15);">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                { (folderDetailWords?.length > 0) && (
                  <button onClick={studyFolderWords} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#2A3114', border: '1.5px solid #5D6B2D', borderRadius: '14px', padding: '11px 18px', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '14px', color: '#a8c45a', cursor: 'pointer', boxShadow: '0 4px 0 #1a200c' }} data-hover="background:#3a4520;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M9 9l4 3-4 3V9z"/></svg>
                    Học Flashcard
                  </button>
                )}
                <button onClick={openFolderAddWordModal} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#5D6B2D', border: 'none', borderRadius: '14px', padding: '12px 18px', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '14px', color: '#FFF8EB', cursor: 'pointer', boxShadow: '0 4px 0 #3E4A1B' }} data-hover="background:#697A35;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
                  Thêm từ mới
                </button>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div data-sk="panel" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: `${headerBg}`, border: `1px solid ${panelBorder}`, borderRadius: '16px', padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#E08A2C' }}></span>
              <span data-sk="ink2" style={{ fontSize: '13.5px', fontWeight: '700', color: `${ink2Color}` }}>{ folderDetailWords?.length || 0 } từ vựng</span>
            </div>
          </div>

          {/* Loading */}
          { folderDetailLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px', color: `${ink2Color}` }}>
              <div style={{ width: '24px', height: '24px', border: `3px solid ${panelBorder}`, borderTopColor: '#5D6B2D', borderRadius: '50%', animation: 'tidSpin .7s linear infinite' }}></div>
              <style>{`@keyframes tidSpin{to{transform:rotate(360deg)}}`}</style>
              <span style={{ fontWeight: '700', fontSize: '14px' }}>Đang tải từ vựng...</span>
            </div>
          ) : folderDetailWords?.length === 0 ? (
            /* Empty state */
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>📚</div>
              <div data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '20px', color: `${inkColor}`, marginBottom: '8px' }}>Thư mục trống</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: `${ink2Color}`, marginBottom: '24px' }}>Thêm từ vựng đầu tiên vào đây.</div>
              <button onClick={openFolderAddWordModal} style={{ background: '#5D6B2D', border: 'none', borderRadius: '14px', color: '#FFF8EB', padding: '12px 24px', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 0 #3E4A1B' }}>
                + Thêm từ đầu tiên
              </button>
            </div>
          ) : (
            /* Word cards grid */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: '14px' }}>
              { (folderDetailWords||[]).map((w, wi) => (
                <div key={wi} data-sk="panel" style={{ background: `${headerBg}`, border: `1px solid ${panelBorder}`, borderRadius: '18px', padding: '18px 20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ flex: '1', minWidth: '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '5px' }}>
                      <span data-sk="ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '17px', color: `${inkColor}` }}>{ w.word }</span>
                      { w.pos && <span style={{ fontSize: '10px', fontWeight: '800', background: 'rgba(93,107,45,.25)', color: '#a8c45a', borderRadius: '6px', padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '.05em' }}>{ w.pos }</span> }
                      <button onClick={w.speak} title="Nghe phát âm" style={{ background: 'rgba(93,107,45,.15)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#88a23f' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                      </button>
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: `${ink2Color}`, lineHeight: '1.45' }}>{ w.definition }</div>
                    { w.example && <div style={{ fontSize: '12.5px', fontWeight: '600', color: `${titleColor}`, marginTop: '6px', fontStyle: 'italic', lineHeight: '1.4' }}>"{w.example}"</div> }
                  </div>
                  <button onClick={()=>deleteFolderWord(w.id)} title="Xoá" style={{ background: 'rgba(255,80,80,.08)', border: 'none', borderRadius: '8px', color: '#FF8080', padding: '6px 7px', cursor: 'pointer', flexShrink: '0', display: 'flex', alignItems: 'center' }} data-hover="background:rgba(255,80,80,.18);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
              )) }
            </div>
          )}

          {/* Danger zone */}
          { !folderDetailLoading && deleteFolderDetail && (
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${panelBorder}` }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: `${titleColor}`, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '.1em' }}>Vùng nguy hiểm</div>
              <button onClick={deleteFolderDetail} style={{ background: 'rgba(255,80,80,.08)', border: '1px solid rgba(255,80,80,.2)', borderRadius: '12px', color: '#FF8080', padding: '9px 16px', fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }} data-hover="background:rgba(255,80,80,.16);">
                Xoá thư mục này
              </button>
            </div>
          )}
        </div>
        </React.Fragment>) : null }

      </div>
    </main>
  </div>

  <div style={{ maxWidth: '1320px', margin: '46px auto 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
    <span style={{ fontSize: '13px', fontWeight: '700', color: '#8a8f72' }}>Cùng một bộ thẻ trên</span>
    <span style={{ fontSize: '13px', fontWeight: '800', color: '#5D6B2D', background: `${headerBg}`, border: '1px solid #E4DEC9', padding: '6px 12px', borderRadius: '12px' }}>📱 Màn hình điện thoại</span>
    <span style={{ fontSize: '13px', fontWeight: '600', color: `${titleColor}` }}>— lật ở đâu cũng đồng bộ</span>
  </div>

  <div data-screen-label="Mobile · Study view" style={{ maxWidth: '1320px', margin: '18px auto 0', display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>

    <div data-sk="m-frame" style={{ width: '392px', height: '812px', background: '#1F1F1F', borderRadius: '50px', padding: '13px', boxShadow: '0 40px 80px -30px rgba(46,53,20,.5)', flexShrink: '0' }}>
      <div data-sk="m-screen" style={{ width: '100%', height: '100%', background: '#FFF8EB', borderRadius: '38px', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div data-sk="m-statusink" style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 26px', zIndex: '5' }}>
          <span style={{ fontWeight: '800', fontSize: '14px', color: '#2A3114' }}>9:41</span>
          <div data-sk="m-notch" style={{ width: '120px', height: '26px', background: '#1F1F1F', borderRadius: '999px', position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '8px' }}></div>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <svg width="17" height="11" viewBox="0 0 17 11" fill="#2A3114"><rect x="0" y="3" width="3" height="8" rx="1"></rect><rect x="4" y="1.5" width="3" height="9.5" rx="1"></rect><rect x="8" y="0" width="3" height="11" rx="1" opacity=".4"></rect></svg>
            <svg width="22" height="11" viewBox="0 0 24 12" fill="none"><rect x="1" y="1" width="20" height="10" rx="3" stroke="#2A3114" strokeWidth="1.2"></rect><rect x="2.5" y="2.5" width="13" height="7" rx="1.5" fill="#2A3114"></rect><rect x="22" y="4" width="1.5" height="4" rx=".7" fill="#2A3114"></rect></svg>
          </div>
        </div>

        <div style={{ padding: '48px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            { navAvatarUrl
              ? <img src={navAvatarUrl} alt={userName} style={{ width: '36px', height: '36px', borderRadius: '11px', objectFit: 'cover', flexShrink: '0' }} />
              : <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: '#46531F', color: '#FFF8EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '14px', flexShrink: '0' }}>{ navInitials }</div>
            }
            <div style={{ lineHeight: '1.1' }}>
              <div data-sk="m-ink2" style={{ fontSize: '11px', fontWeight: '700', color: `${titleColor}` }}>Chào buổi sáng,</div>
              <div data-sk="m-ink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '15px', color: '#2A3114' }}>{ userName }</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={toggleDark} data-sk="m-bar" style={{ width: '34px', height: '34px', borderRadius: '11px', border: `1px solid ${panelBorder}`, background: `${headerBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: '0' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#EE9A23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: `${sunDisplay}` }}><circle cx="12" cy="12" r="4.5"></circle><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"></path></svg>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="#F6C453" stroke="#F6C453" strokeWidth="1.6" strokeLinejoin="round" style={{ display: `${moonDisplay}` }}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z"></path></svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFF3D6', border: '1px solid #F6C453', borderRadius: '11px', padding: '6px 11px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#EE9A23"><path d="M12 2c1 3-1 4-1 6 2-1 3 1 4 2 2 2 2 5 0 7a6 6 0 0 1-9-1c-1-2 0-4 1-5 0 2 1 3 2 3-1-2 0-4 1-5 1 2 2 1 2-1 1-2 0-4-2-6Z"></path></svg>
              <span style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '14px', color: '#9a5a14' }}>7</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '4px 20px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span data-sk="m-ink" style={{ fontSize: '12px', fontWeight: '800', color: '#5D6B2D' }}>Môi trường · Thẻ { human }/{ total }</span>
            <span data-sk="m-ink2" style={{ fontSize: '12px', fontWeight: '800', color: '#9a5a14' }}>{ progressW }</span>
          </div>
          <div data-sk="m-track" style={{ height: '9px', borderRadius: '6px', background: '${nightCardBorder}', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressW}`, borderRadius: '6px', background: 'linear-gradient(90deg,#F6C453,#EE9A23)', transition: 'width .5s' }}></div>
          </div>
        </div>

        <div style={{ flex: '1', padding: '8px 20px 0', perspective: '1600px' }}>
          <div onClick={flip} style={{ position: 'relative', width: '100%', height: '100%', cursor: 'pointer', transformStyle: 'preserve-3d', transition: 'transform .6s cubic-bezier(.2,.85,.3,1)', transform: `${cardTransform}` }}>
            <div style={{ position: 'absolute', inset: '0', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: '26px', background: `${cardFrontBg}`, border: `1px solid ${cardBorder}`, boxShadow: '0 18px 36px -20px rgba(238,154,35,.55)', padding: '22px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: '0', display: `${starsDisp}`, pointerEvents: 'none' }}>
                { (cardStars)?.map?.((st, _index) => (<React.Fragment key={_index}>
                  <svg viewBox="0 0 24 24" style={{ position: 'absolute', top: `${st.top}`, left: `${st.left}`, width: `${st.size}`, height: `${st.size}`, animation: `tidTwinkle ${st.dur} ease-in-out ${st.delay} infinite` }}><path d="M12 0C12.7 6.4 17.6 11.3 24 12 17.6 12.7 12.7 17.6 12 24 11.3 17.6 6.4 12.7 0 12 6.4 11.3 11.3 6.4 12 0Z" fill="#EAF1FF"></path></svg>
                </React.Fragment>)) }
              </div>
              <div style={{ position: 'absolute', bottom: '-70px', left: '-40px', width: '170px', height: '170px', borderRadius: '50%', background: '#F6A82C', display: `${sunBlobDisp}` }}></div>
              <div style={{ position: 'absolute', bottom: '-46px', left: '-14px', width: '110px', height: '110px', borderRadius: '50%', background: `${headerBg}`, display: `${sunFaceDisp}`, alignItems: 'flex-start', justifyContent: 'center', paddingTop: '28px' }}>
                <svg width="64" height="36" viewBox="0 0 64 36"><circle cx="23" cy="12" r="3.6" fill="#1F1F1F"></circle><circle cx="41" cy="12" r="3.6" fill="#1F1F1F"></circle><path d="M21 21c3.5 5 18 5 22 0" stroke="#1F1F1F" strokeWidth="3.2" fill="none" strokeLinecap="round"></path></svg>
              </div>
              <div style={{ position: 'absolute', bottom: '-78px', left: '-46px', width: '190px', height: '190px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,219,255,.45) 0%,rgba(160,190,250,.22) 42%,transparent 68%)', display: `${moonDisp}`, animation: 'tidHalo 5s ease-in-out infinite', pointerEvents: 'none' }}></div>
              <div style={{ position: 'absolute', bottom: '-46px', left: '-14px', width: '110px', height: '110px', borderRadius: '50%', background: 'radial-gradient(circle at 38% 34%,#FCFDFF,#C4D4F2)', boxShadow: '0 0 34px 8px rgba(198,217,255,.5)', display: `${moonDisp}`, alignItems: 'flex-start', justifyContent: 'center', paddingTop: '28px', animation: 'tidMoonGlow 4s ease-in-out infinite', overflow: 'hidden' }}>
                <span style={{ position: 'absolute', top: '14px', left: '24px', width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(150,167,210,.4)' }}></span>
                <span style={{ position: 'absolute', top: '48px', left: '16px', width: '7px', height: '7px', borderRadius: '50%', background: 'rgba(150,167,210,.34)' }}></span>
                <svg width="64" height="36" viewBox="0 0 64 36" style={{ position: 'relative', zIndex: '1' }}><circle cx="23" cy="12" r="3.6" fill="#2B3A63"></circle><circle cx="41" cy="12" r="3.6" fill="#2B3A63"></circle><path d="M21 21c3.5 5 18 5 22 0" stroke="#2B3A63" strokeWidth="3.2" fill="none" strokeLinecap="round"></path></svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <span style={{ background: '#2A3114', color: '#F6C453', fontWeight: '800', fontSize: '12px', padding: '5px 11px', borderRadius: '999px' }}>{ posVi }</span>
              </div>
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', textAlign: 'center', position: 'relative' }}>
                <h3 style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '34px', lineHeight: '1.05', margin: '0', color: `${cardInk}`, wordBreak: 'break-word' }}>{ word }</h3>
                <span style={{ fontFamily: '\'Space Mono\',monospace', fontSize: '14px', color: `${cardSub}` }}>{ ipa }</span>
                <button onClick={speakBtn} style={{ width: '46px', height: '46px', borderRadius: '50%', border: 'none', background: '#F6C453', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 0 #d6a531', marginTop: '6px' }} data-hover="filter:brightness(1.05);">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2A3114" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"></path></svg>
                </button>
              </div>
              <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: '800', color: `${cardHint}`, position: 'relative' }}>Chạm để xem nghĩa</div>
            </div>
            <div style={{ position: 'absolute', inset: '0', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: '26px', background: '#5D6B2D', backgroundImage: 'linear-gradient(155deg,#6A7A36,#46531F)', color: '#FFF8EB', padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '.12em', color: '#CBD3A6' }}>NGHĨA TIẾNG VIỆT</span>
              <h3 style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '26px', lineHeight: '1.15', margin: '0' }}>{ vi }</h3>
              <div style={{ background: 'rgba(0,0,0,.16)', borderRadius: '14px', padding: '13px', borderLeft: '3px solid #F6C453' }}>
                <p style={{ margin: '0 0 5px', fontSize: '14px', fontWeight: '600', fontStyle: 'italic', lineHeight: '1.4' }}>"{ exampleEn }"</p>
                <p style={{ margin: '0', fontSize: '12.5px', color: '#C7CFA3', lineHeight: '1.4' }}>{ exampleVi }</p>
              </div>
              <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#A9B189' }}>↺ Chạm để lật lại</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
          <button onClick={prev} style={{ width: '50px', height: '50px', borderRadius: '16px', border: '1px solid #E4DEC9', background: `${headerBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 3px 0 #E4DEC9', color: '#5D6B2D' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
          </button>
          <button onClick={flip} style={{ flex: '1', height: '54px', borderRadius: '17px', border: 'none', background: '#5D6B2D', color: '#FFF8EB', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 0 #3E4A1B' }}>Lật thẻ</button>
          <button onClick={next} style={{ width: '50px', height: '50px', borderRadius: '16px', border: 'none', background: '#F6C453', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 3px 0 #d6a531', color: '#2A3114' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"></path></svg>
          </button>
        </div>

        <div data-sk="m-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '10px 18px 22px', borderTop: '1px solid ${nightCardBorder}', background: `${headerBg}` }}>
          <div data-sk="m-active" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: '#5D6B2D' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 8l10 5 10-5-10-5Z"></path><path d="M2 13l10 5 10-5"></path></svg>
            <span style={{ fontSize: '10.5px', fontWeight: '800' }}>Bộ từ</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: '#b6bb9c' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path></svg>
            <span style={{ fontSize: '10.5px', fontWeight: '700' }}>Thống kê</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: '#b6bb9c' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><path d="M22 4 12 14.01l-3-3"></path></svg>
            <span style={{ fontSize: '10.5px', fontWeight: '700' }}>Đã nhớ</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: '#b6bb9c' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4 4-6 8-6s8 2 8 6"></path></svg>
            <span style={{ fontSize: '10.5px', fontWeight: '700' }}>Cá nhân</span>
          </div>
        </div>
      </div>
    </div>

    <div style={{ maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#EEF1E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0', color: '#5D6B2D', fontFamily: '\'Nunito\'', fontWeight: '900' }}>1</div>
        <div>
          <div style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '16px', color: '#2A3114' }}>Đồng bộ trạng thái</div>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#6b7155', lineHeight: '1.5' }}>Lật thẻ trên máy tính hay điện thoại đều dùng chung một bộ dữ liệu thật.</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#FFF3D6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0', color: '#9a5a14', fontFamily: '\'Nunito\'', fontWeight: '900' }}>2</div>
        <div>
          <div style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '16px', color: '#2A3114' }}>Thao tác một tay</div>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#6b7155', lineHeight: '1.5' }}>Nút điều hướng đặt thấp trong tầm ngón cái, vùng chạm tối thiểu 50px.</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#F4E7DE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0', color: '#C2693B', fontFamily: '\'Nunito\'', fontWeight: '900' }}>3</div>
        <div>
          <div style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '16px', color: '#2A3114' }}>Phát âm tức thì</div>
          <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#6b7155', lineHeight: '1.5' }}>Chạm loa để nghe phát âm chuẩn — hoạt động cả hai màn hình.</p>
        </div>
      </div>
    </div>

  </div>
  { (practiceActive) ? (<React.Fragment>
    <div data-sk="overlay" style={{ position: 'fixed', inset: '0', zIndex: '70', background: 'rgba(31,32,20,.55)', backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: '\'Plus Jakarta Sans\',system-ui,sans-serif' }}>
      <div data-sk="sheet" style={{ width: '100%', maxWidth: '680px', maxHeight: '92vh', overflow: 'auto', background: `${contentBg}`, borderRadius: '30px', boxShadow: '0 40px 90px -28px rgba(20,24,8,.7)', border: `1px solid ${listBorder}`, position: 'relative' }}>

        <div data-sk="phead" style={{ position: 'sticky', top: '0', zIndex: '3', background: `${contentBg}`, padding: '22px 26px 14px', borderBottom: `1px solid ${listBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '38px', height: '38px', borderRadius: '12px', background: `${pAccent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF8EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 8l10 5 10-5-10-5Z"></path><path d="M2 13l10 5 10-5"></path></svg>
            </span>
            <div style={{ lineHeight: '1.15' }}>
              <div data-sk="pink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '18px', color: `${inkColor}` }}>{ pTitle }</div>
              <div data-sk="pink2" style={{ fontSize: '12.5px', fontWeight: '700', color: `${titleColor}` }}>Chủ đề Môi trường · IELTS</div>
            </div>
            <button onClick={closePractice} style={{ marginLeft: 'auto', width: '38px', height: '38px', borderRadius: '12px', border: '1px solid ${nightCardBorder}', background: `${headerBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} data-hover={`${panelHover}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c8362" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg>
            </button>
          </div>
          { (pIsMatching) ? (<React.Fragment>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '14px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                { (mHearts)?.map?.((h, _index) => (<React.Fragment key={_index}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={h.color}><path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21Z"></path></svg>
                </React.Fragment>)) }
              </div>
              <div data-sk="m-track" style={{ flex: '1', height: '10px', borderRadius: '6px', background: '${nightCardBorder}', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${mProgressW}`, borderRadius: '6px', background: 'linear-gradient(90deg,#5D6B2D,#8AA04A)', transition: 'width .4s cubic-bezier(.2,.8,.3,1)' }}></div>
              </div>
              <span data-sk="pink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '14px', color: `${inkColor}` }}>{ mMatched }/{ mTotal }</span>
            </div>
          </React.Fragment>) : null }
          { (pIsQuizOrListen) ? (<React.Fragment>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '14px' }}>
              <span data-sk="pink2" style={{ fontSize: '12.5px', fontWeight: '800', color: `${titleColor}`, whiteSpace: 'nowrap' }}>Câu { pHuman }/{ pLen }</span>
              <div data-sk="m-track" style={{ flex: '1', height: '10px', borderRadius: '6px', background: '${nightCardBorder}', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pProgressW}`, borderRadius: '6px', background: 'linear-gradient(90deg,#F6C453,#EE9A23)', transition: 'width .4s cubic-bezier(.2,.8,.3,1)' }}></div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '14px', color: '#5D6B2D', whiteSpace: 'nowrap' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5D6B2D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>{ pCorrect }
              </span>
            </div>
          </React.Fragment>) : null }
        </div>

        { (pShowQuizBody) ? (<React.Fragment>
          <div style={{ padding: '24px 26px 28px' }}>
            { (pShowQuizToggle) ? (<React.Fragment>
              <div data-sk="seg" style={{ display: 'inline-flex', gap: '4px', background: `${listHeaderBg}`, borderRadius: '13px', padding: '4px', marginBottom: '22px' }}>
                <button onClick={setMeaning} style={{ display: 'flex', alignItems: 'center', gap: '7px', border: 'none', borderRadius: '10px', padding: '8px 15px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', background: `${qmMeaningBg}`, color: `${qmMeaningInk}`, transition: 'all .2s' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"></path></svg>
                  Định nghĩa
                </button>
                <button onClick={setContext} style={{ display: 'flex', alignItems: 'center', gap: '7px', border: 'none', borderRadius: '10px', padding: '8px 15px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', background: `${qmContextBg}`, color: `${qmContextInk}`, transition: 'all .2s' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"></path></svg>
                  Điền chỗ trống
                </button>
              </div>
            </React.Fragment>) : null }

            <div data-sk="prompt" style={{ background: `${headerBg}`, border: `1px solid ${listBorder}`, borderRadius: '20px', padding: '24px', marginBottom: '18px', boxShadow: '0 8px 22px -16px rgba(46,53,20,.35)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '14px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', letterSpacing: '.1em', color: `${pAccent}` }}>{ pLabel }</span>
                <span data-sk="chip" style={{ background: '#EEF1E2', color: '#5D6B2D', fontSize: '11px', fontWeight: '800', padding: '3px 9px', borderRadius: '999px' }}>{ pPosEn }</span>
              </div>
              { (pIsMeaning) ? (<React.Fragment>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                  <h3 data-sk="pink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '30px', lineHeight: '1.2', margin: '0', color: `${inkColor}` }}>{ pPromptMeaning }</h3>
                  <span style={{ fontSize: '13px', color: `${titleColor}`, fontWeight: '700', whiteSpace: 'nowrap' }}>nghĩa là…</span>
                </div>
              </React.Fragment>) : null }
              { (pIsContext) ? (<React.Fragment>
                <p data-sk="pink" style={{ fontFamily: '\'Nunito\'', fontWeight: '700', fontSize: '21px', lineHeight: '1.5', margin: '0', color: `${inkColor}` }}>{ pPromptContext }</p>
              </React.Fragment>) : null }
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              { (pOptions)?.map?.((opt, _index) => (<React.Fragment key={_index}>
                <button onClick={opt.pick} style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', background: `${opt.bg}`, border: `2px solid ${opt.border}`, borderRadius: '16px', padding: '15px 16px', cursor: 'pointer', transition: 'all .18s' }} data-hover="transform:translateY(-2px);box-shadow:0 8px 18px -12px rgba(46,53,20,.4);">
                  <span style={{ width: '28px', height: '28px', borderRadius: '9px', background: `${opt.numBg}`, color: `${opt.numInk}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '14px', flexShrink: '0' }}>{ opt.num }</span>
                  <span style={{ fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '16px', color: `${opt.ink}`, flex: '1' }}>{ opt.label }</span>
                  { (opt.showCheck) ? (<React.Fragment>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5D6B2D" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                  </React.Fragment>) : null }
                  { (opt.showX) ? (<React.Fragment>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C2693B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg>
                  </React.Fragment>) : null }
                </button>
              </React.Fragment>)) }
            </div>

            { (pAnswered) ? (<React.Fragment>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginTop: '20px' }}>
                <span data-sk="pink2" style={{ fontSize: '13px', fontWeight: '700', color: `${titleColor}` }}>Phím <b style={{ color: `${listBtnInk}` }}>1–4</b> để chọn · <b style={{ color: `${listBtnInk}` }}>Enter</b> để tiếp</span>
                <button onClick={practiceNext} style={{ display: 'flex', alignItems: 'center', gap: '9px', background: `${pAccent}`, border: 'none', borderRadius: '14px', padding: '13px 22px', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '15px', color: '#FFF8EB', cursor: 'pointer', boxShadow: '0 4px 0 rgba(0,0,0,.16)' }} data-hover="filter:brightness(1.08);">
                  { pNextLabel }
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
                </button>
              </div>
            </React.Fragment>) : null }
          </div>
        </React.Fragment>) : null }

        { (pShowListenBody) ? (<React.Fragment>
          <div style={{ padding: '26px 26px 28px' }}>
            { (pIsListening) ? (<React.Fragment>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', marginBottom: '22px' }}>
              <button onClick={listeningSay} style={{ width: '84px', height: '84px', borderRadius: '50%', border: 'none', background: '#5D6B2D', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 6px 0 #3E4A1B' }} data-hover="filter:brightness(1.08);" style-active="transform:translateY(3px);box-shadow:0 3px 0 #3E4A1B;">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FFF8EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"></path></svg>
              </button>
              <div>
                <div data-sk="pink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '17px', color: `${inkColor}` }}>Nghe và gõ lại từ tiếng Anh</div>
                <div data-sk="pink2" style={{ fontSize: '13px', fontWeight: '600', color: `${titleColor}`, marginTop: '3px' }}>Bấm loa để nghe lại · <b style={{ color: `${listBtnInk}` }}>Ctrl+X</b> phát lại</div>
              </div>
            </div>
            </React.Fragment>) : null }
            { (pIsContext) ? (<React.Fragment>
            <div data-sk="prompt" style={{ background: `${headerBg}`, border: `1px solid ${listBorder}`, borderRadius: '20px', padding: '24px', marginBottom: '20px', boxShadow: '0 8px 22px -16px rgba(46,53,20,.35)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '14px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', letterSpacing: '.1em', color: `${pAccent}` }}>{ pLabel }</span>
                <span data-sk="chip" style={{ background: '#EEF1E2', color: '#5D6B2D', fontSize: '11px', fontWeight: '800', padding: '3px 9px', borderRadius: '999px' }}>{ pPosEn }</span>
              </div>
              <p data-sk="pink" style={{ fontFamily: '\'Nunito\'', fontWeight: '700', fontSize: '21px', lineHeight: '1.9', margin: '0', color: `${inkColor}` }}>{ pPromptBefore }<input value={ pInput } onChange={ listeningInput } size={ pInputSize } placeholder="______" autoFocus autoComplete="off" autoCapitalize="off" spellCheck={false} style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '21px', textAlign: 'center', color: '#9a5a14', background: 'transparent', border: 'none', borderBottom: `2.5px solid ${pInputBorder}`, outline: 'none', padding: '0 6px', margin: '0 3px', minWidth: '70px' }} />{ pPromptAfter }</p>
            </div>
            </React.Fragment>) : null }

            { (pIsListening) ? (<React.Fragment>
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <input value={ pInput } onChange={ listeningInput } placeholder={ pInputPlaceholder } autoComplete="off" autoCapitalize="off" spellCheck={false} style={{ width: '100%', boxSizing: 'border-box', fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '22px', textAlign: 'center', color: `${inkColor}`, background: `${headerBg}`, border: `2px solid ${pInputBorder}`, borderRadius: '16px', padding: '18px 16px', outline: 'none', letterSpacing: '.01em' }} />
            </div>
            </React.Fragment>) : null }

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', justifyContent: 'center', marginBottom: '20px' }}>
              { (pLetterSlots)?.map?.((ls, _index) => (<React.Fragment key={_index}>
                <span style={{ width: '34px', height: '42px', borderRadius: '10px', background: `${ls.bg}`, border: `1.5px solid ${ls.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '\'Space Mono\',monospace', fontWeight: '700', fontSize: '19px', color: `${ls.ink}` }}>{ ls.ch }</span>
              </React.Fragment>)) }
            </div>

            { (pChecked) ? (<React.Fragment>
              <div data-sk="prompt" style={{ background: `${headerBg}`, border: `1px solid ${listBorder}`, borderRadius: '16px', padding: '16px 18px', marginBottom: '18px' }}>
                <div style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '16px', color: `${pTypedFbColor}`, marginBottom: '8px' }}>{ pTypedFeedback }</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                  <span data-sk="pink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '20px', color: `${inkColor}` }}>{ pAnswerWord }</span>
                  <span style={{ fontFamily: '\'Space Mono\',monospace', fontSize: '14px', color: '#7c8362' }}>{ pIpa }</span>
                  <span data-sk="pink2" style={{ fontSize: '14px', color: '#6b7155' }}>— { pVi }</span>
                </div>
                <p data-sk="pink2" style={{ margin: '8px 0 0', fontSize: '13.5px', fontStyle: 'italic', color: `${manifestSub}`, lineHeight: '1.4' }}>"{ pExample }"</p>
              </div>
            </React.Fragment>) : null }

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              { (pHintHidden) ? (<React.Fragment>
                <button onClick={listeningHint} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFF3D6', border: '1px solid #F4DFA8', borderRadius: '13px', padding: '12px 16px', fontWeight: '800', fontSize: '13.5px', color: '#9a5a14', cursor: 'pointer' }} data-hover="background:#FBEABF;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2Z"></path></svg>
                  Gợi ý
                </button>
              </React.Fragment>) : null }
              { (pShowNext) ? (<React.Fragment>
                <button onClick={practiceNext} style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', background: `${pAccent}`, border: 'none', borderRadius: '14px', padding: '14px 22px', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '15px', color: '#FFF8EB', cursor: 'pointer', boxShadow: '0 4px 0 rgba(0,0,0,.16)' }} data-hover="filter:brightness(1.08);">
                  { pNextLabel }
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
                </button>
              </React.Fragment>) : null }
              { (pShowCheck) ? (<React.Fragment>
                <button onClick={checkType} style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', background: '#5D6B2D', border: 'none', borderRadius: '14px', padding: '14px 22px', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '15px', color: '#FFF8EB', cursor: 'pointer', boxShadow: '0 4px 0 #3E4A1B' }} data-hover="filter:brightness(1.08);">
                  Kiểm tra
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                </button>
              </React.Fragment>) : null }
            </div>
          </div>
        </React.Fragment>) : null }

        { (pShowMatching) ? (<React.Fragment>
          <div style={{ padding: '22px 26px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span data-sk="pink2" style={{ fontSize: '13.5px', fontWeight: '700', color: `${manifestSub}` }}>Nối từ tiếng Anh với nghĩa tiếng Việt</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '14px', color: '#C2693B' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#F6C453" stroke="#EE9A23" strokeWidth="1.4"><path d="m12 2 3 6.5 7 .8-5.2 4.8 1.5 7L12 18l-6.8 4 1.5-7L1.5 9.3l7-.8L12 2Z"></path></svg>
                { mScore }
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                { (mLeft)?.map?.((L, _index) => (<React.Fragment key={_index}>
                  <button onClick={L.pick} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: `${L.bg}`, border: `2px solid ${L.border}`, borderRadius: '15px', padding: '15px 16px', cursor: 'pointer', opacity: `${L.op}`, transition: 'all .18s', textAlign: 'left' }} data-hover="transform:translateY(-2px);">
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: `${L.border}`, flexShrink: '0' }}></span>
                    <span style={{ fontFamily: '\'Nunito\'', fontWeight: '800', fontSize: '16px', color: `${L.ink}` }}>{ L.word }</span>
                  </button>
                </React.Fragment>)) }
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                { (mRight)?.map?.((R, _index) => (<React.Fragment key={_index}>
                  <button onClick={R.pick} style={{ display: 'flex', alignItems: 'center', background: `${R.bg}`, border: `2px solid ${R.border}`, borderRadius: '15px', padding: '15px 16px', cursor: 'pointer', opacity: `${R.op}`, transition: 'all .18s', textAlign: 'left' }} data-hover="transform:translateY(-2px);">
                    <span style={{ fontWeight: '700', fontSize: '14.5px', color: `${R.ink}`, lineHeight: '1.35' }}>{ R.vi }</span>
                  </button>
                </React.Fragment>)) }
              </div>
            </div>
          </div>
        </React.Fragment>) : null }

        { (pShowResult) ? (<React.Fragment>
          <div style={{ padding: '30px 26px 30px', textAlign: 'center' }}>
            <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: `${listBtnBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42px', margin: '0 auto 16px' }}>{ pResultEmoji }</div>
            <h2 data-sk="pink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '26px', margin: '0 0 8px', color: `${inkColor}` }}>{ pResultTitle }</h2>
            <p data-sk="pink2" style={{ margin: '0 auto 24px', fontSize: '14.5px', color: `${titleColor}`, fontWeight: '500', maxWidth: '380px', lineHeight: '1.5' }}>{ pResultSub }</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '26px' }}>
              <div data-sk="prompt" style={{ flex: '1', maxWidth: '150px', background: `${headerBg}`, border: `1px solid ${listBorder}`, borderRadius: '18px', padding: '16px 10px' }}>
                <div data-sk="pink" style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '26px', color: '#5D6B2D' }}>{ rStatA }</div>
                <div data-sk="pink2" style={{ fontSize: '12px', fontWeight: '700', color: `${titleColor}`, marginTop: '2px' }}>{ rStatALabel }</div>
              </div>
              <div data-sk="prompt" style={{ flex: '1', maxWidth: '150px', background: `${headerBg}`, border: `1px solid ${listBorder}`, borderRadius: '18px', padding: '16px 10px' }}>
                <div style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '26px', color: '#C2693B' }}>{ rStatB }</div>
                <div data-sk="pink2" style={{ fontSize: '12px', fontWeight: '700', color: `${titleColor}`, marginTop: '2px' }}>{ rStatBLabel }</div>
              </div>
              <div data-sk="prompt" style={{ flex: '1', maxWidth: '150px', background: `${headerBg}`, border: `1px solid ${listBorder}`, borderRadius: '18px', padding: '16px 10px' }}>
                <div style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '26px', color: '#9a5a14' }}>{ rStatC }</div>
                <div data-sk="pink2" style={{ fontSize: '12px', fontWeight: '700', color: `${titleColor}`, marginTop: '2px' }}>{ rStatCLabel }</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={restartPractice} style={{ display: 'flex', alignItems: 'center', gap: '9px', background: `${headerBg}`, border: '1px solid ${nightCardBorder}', borderRadius: '14px', padding: '13px 20px', fontWeight: '800', fontSize: '14.5px', color: '#5D6B2D', cursor: 'pointer' }} data-hover={`${panelHover}`}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v6h6M21 21v-6h-6"></path><path d="M3 9a9 9 0 0 1 15-3l3 3M21 15a9 9 0 0 1-15 3l-3-3"></path></svg>
                Làm lại
              </button>
              { (hasMistakes) ? (<React.Fragment>
                <button onClick={reviewMistakes} style={{ display: 'flex', alignItems: 'center', gap: '9px', background: '#C2693B', border: 'none', borderRadius: '14px', padding: '13px 22px', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '14.5px', color: '#FFF8EB', cursor: 'pointer', boxShadow: '0 4px 0 #9a4f29' }} data-hover="filter:brightness(1.07);">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18M21 21H3"></path><path d="M7 16l4-5 3 3 4-6"></path></svg>
                  Ôn từ sai ({ reviewBadge })
                </button>
              </React.Fragment>) : null }
              <button onClick={closePractice} style={{ display: 'flex', alignItems: 'center', gap: '9px', background: '#5D6B2D', border: 'none', borderRadius: '14px', padding: '13px 22px', fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '14.5px', color: '#FFF8EB', cursor: 'pointer', boxShadow: '0 4px 0 #3E4A1B' }} data-hover="filter:brightness(1.08);">
                Xong
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
              </button>
            </div>
          </div>
        </React.Fragment>) : null }

        { (miniConfettiPieces && miniConfettiPieces.length>0) ? (<React.Fragment>
          <div style={{ position: 'absolute', inset: '0', zIndex: '55', pointerEvents: 'none', overflow: 'hidden' }}>
            { (miniConfettiPieces)?.map?.((p, _index) => (<React.Fragment key={_index}>
              <span style={{ position: 'absolute', top: '-20px', left: `${p.left}`, width: `${p.size}`, height: `${p.size}`, background: `${p.bg}`, borderRadius: `${p.radius}`, animation: `tidFall ${p.dur} cubic-bezier(.3,.4,.6,1) ${p.delay} forwards` }}></span>
            </React.Fragment>)) }
          </div>
        </React.Fragment>) : null }

      </div>
    </div>
  </React.Fragment>) : null }
  { (showConfetti) ? (<React.Fragment>
    <div style={{ position: 'fixed', inset: '0', zIndex: '60', pointerEvents: 'none', overflow: 'hidden' }}>
      { (confettiPieces)?.map?.((p, _index) => (<React.Fragment key={_index}>
        <span style={{ position: 'absolute', top: '-30px', left: `${p.left}`, width: `${p.size}`, height: `${p.size}`, background: `${p.bg}`, borderRadius: `${p.radius}`, animation: `tidFall ${p.dur} cubic-bezier(.3,.4,.6,1) ${p.delay} forwards` }}></span>
      </React.Fragment>)) }
      <div style={{ position: 'absolute', top: '34%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto', background: `${headerBg}`, border: `1px solid ${listBorder}`, borderRadius: '24px', boxShadow: `${nightCardShadow}`, padding: '26px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', animation: 'tidPop .5s cubic-bezier(.2,.9,.3,1) forwards', maxWidth: '340px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F6C453', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '16px', marginBottom: '4px' }}>
          <svg width="48" height="30" viewBox="0 0 58 36"><circle cx="22" cy="12" r="3.4" fill="#1F1F1F"></circle><circle cx="38" cy="12" r="3.4" fill="#1F1F1F"></circle><path d="M20 21c3 5 15 5 18 0" stroke="#1F1F1F" strokeWidth="3" fill="none" strokeLinecap="round"></path></svg>
        </div>
        <h3 style={{ fontFamily: '\'Nunito\'', fontWeight: '900', fontSize: '24px', margin: '0', color: `${inkColor}` }}>Hoàn thành bộ thẻ! 🎉</h3>
        <p style={{ margin: '0', fontSize: '14.5px', color: `${titleColor}`, fontWeight: '500' }}>Bạn đã ôn hết 10 từ chủ đề Môi trường. Tuyệt vời!</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button onClick={closeConfetti} style={{ background: `${listBtnBg}`, color: `${listBtnInk}`, border: 'none', borderRadius: '13px', padding: '11px 18px', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>Đóng</button>
          <button onClick={closeConfetti} style={{ background: '#5D6B2D', color: '#FFF8EB', border: 'none', borderRadius: '13px', padding: '11px 20px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 0 #3E4A1B' }}>Học lại bộ này</button>
        </div>
      </div>
    </div>
  </React.Fragment>) : null }
    </>
  );
}
