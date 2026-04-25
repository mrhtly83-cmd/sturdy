// app/saved.tsx
// v7 — Saved scripts library (grouped by child)
// Journal design system: pastel gradient + Manrope + rose accent
// Data: loadSavedScripts() + deleteSavedScript() from src/lib/loadSavedScripts


import { useCallback, useMemo, useState } from 'react';
import {
 ActivityIndicator,
 Alert,
 Pressable,
 RefreshControl,
 ScrollView,
 StyleSheet,
 Text,
 View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors as C, fonts as F } from '../src/theme';
import {
 loadSavedScripts,
 deleteSavedScript,
 type SavedScriptRow,
} from '../src/lib/loadSavedScripts';


// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════


type ChildGroup = {
 key: string;
 childName: string;
 scripts: SavedScriptRow[];
};


const OTHER_KEY = '__unassigned__';


// ═══════════════════════════════════════════════
// SCREEN
// ═══════════════════════════════════════════════


export default function SavedScriptsScreen() {
 const [scripts, setScripts] = useState<SavedScriptRow[]>([]);
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [error, setError] = useState('');


 // ─── Data ───
 const fetchSaved = useCallback(async () => {
   setError('');
   try {
     const data = await loadSavedScripts();
     setScripts(data);
   } catch {
     setError('Could not load your saved scripts.');
   }
 }, []);


 useFocusEffect(
   useCallback(() => {
     setLoading(true);
     fetchSaved().finally(() => setLoading(false));
   }, [fetchSaved])
 );


 const handleRefresh = useCallback(async () => {
   setRefreshing(true);
   Haptics.selectionAsync();
   await fetchSaved();
   setRefreshing(false);
 }, [fetchSaved]);


 // ─── Group by child (preserves newest-first order within groups) ───
 const groups: ChildGroup[] = useMemo(() => {
   const map = new Map<string, ChildGroup>();
   scripts.forEach((sc) => {
     const key = sc.child_profile_id || OTHER_KEY;
     const childName = sc.child_name || 'Other';
     const existing = map.get(key);
     if (existing) {
       existing.scripts.push(sc);
     } else {
       map.set(key, { key, childName, scripts: [sc] });
     }
   });


   // Unassigned scripts drift to the bottom
   const arr = Array.from(map.values());
   arr.sort((a, b) => {
     if (a.key === OTHER_KEY) return 1;
     if (b.key === OTHER_KEY) return -1;
     return 0;
   });
   return arr;
 }, [scripts]);


 // ─── Actions ───
 const handleDelete = (id: string, title: string | null) => {
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
   Alert.alert(
     'Delete script?',
     `Remove "${title || 'this script'}" from your saved scripts?`,
     [
       { text: 'Cancel', style: 'cancel' },
       {
         text: 'Delete',
         style: 'destructive',
         onPress: async () => {
           try {
             await deleteSavedScript(id);
             setScripts((prev) => prev.filter((x) => x.id !== id));
             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
           } catch {
             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
           }
         },
       },
     ]
   );
 };


 const handleOpenScript = (item: SavedScriptRow) => {
   const d = item.structured;
   if (!d) return;
   Haptics.selectionAsync();


   router.push({
     pathname: '/result',
     params: {
       situationSummary: d.situation_summary || '',
       regulateAction: d.regulate?.parent_action || '',
       regulateScript: d.regulate?.script || '',
       regulateCoaching: d.regulate?.coaching || '',
       regulateStrategies: JSON.stringify(d.regulate?.strategies || []),
       connectAction: d.connect?.parent_action || '',
       connectScript: d.connect?.script || '',
       connectCoaching: d.connect?.coaching || '',
       connectStrategies: JSON.stringify(d.connect?.strategies || []),
       guideAction: d.guide?.parent_action || '',
       guideScript: d.guide?.script || '',
       guideCoaching: d.guide?.coaching || '',
       guideStrategies: JSON.stringify(d.guide?.strategies || []),
       avoid: JSON.stringify(d.avoid || []),
       mode: 'sos',
     },
   });
 };


 const handleBack = () => {
   Haptics.selectionAsync();
   if (router.canGoBack()) router.back();
   else router.replace('/(tabs)');
 };


 const handleRetry = () => {
   setLoading(true);
   fetchSaved().finally(() => setLoading(false));
 };


 // ─── Helpers ───
 const formatDate = (iso: string): string => {
   const d = new Date(iso);
   const now = new Date();
   const diff = now.getTime() - d.getTime();
   const days = Math.floor(diff / 86400000);
   if (days === 0) return 'Today';
   if (days === 1) return 'Yesterday';
   if (days < 7) return `${days} days ago`;
   return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
 };


 // ─── Render ───
 return (
   <View style={s.root}>
     <StatusBar style="dark" />


     {/* Pastel gradient background */}
     <LinearGradient
       colors={[C.gradStart, C.gradMid1, C.gradMid2, C.gradEnd]}
       start={{ x: 0, y: 0 }}
       end={{ x: 1, y: 1 }}
       style={StyleSheet.absoluteFill}
     />


     {/* Decorative blobs */}
     <View style={[s.blob, s.blob1]} />
     <View style={[s.blob, s.blob2]} />


     <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
       {/* ─── Header ─── */}
       <View style={s.header}>
         <Pressable onPress={handleBack} hitSlop={12} style={s.backBtn}>
           <Text style={s.backText}>← Back</Text>
         </Pressable>
       </View>


       <View style={s.titleWrap}>
         <Text style={s.title}>Saved Scripts</Text>
         {!loading && scripts.length > 0 && (
           <Text style={s.subtitle}>
             {scripts.length} script{scripts.length !== 1 ? 's' : ''}
             {groups.length > 1 ? ` · ${groups.length} children` : ''}
           </Text>
         )}
       </View>


       {/* ─── Content ─── */}
       {loading ? (
         <View style={s.center}>
           <ActivityIndicator color={C.rose} size="large" />
         </View>
       ) : error ? (
         <View style={s.center}>
           <Text style={s.errorText}>{error}</Text>
           <Pressable onPress={handleRetry}>
             <Text style={s.retryText}>Try again</Text>
           </Pressable>
         </View>
       ) : scripts.length === 0 ? (
         <EmptyState />
       ) : (
         <ScrollView
           contentContainerStyle={s.scroll}
           showsVerticalScrollIndicator={false}
           refreshControl={
             <RefreshControl
               refreshing={refreshing}
               onRefresh={handleRefresh}
               tintColor={C.rose}
             />
           }
         >
           {groups.map((group) => (
             <View key={group.key} style={s.group}>
               {/* Group header */}
               <View style={s.groupHeader}>
                 <Text style={s.groupName}>{group.childName}</Text>
                 <Text style={s.groupCount}>
                   {group.scripts.length} script{group.scripts.length !== 1 ? 's' : ''}
                 </Text>
               </View>


               {/* Script cards */}
               {group.scripts.map((item) => (
                 <Pressable
                   key={item.id}
                   onPress={() => handleOpenScript(item)}
                   style={({ pressed }) => [
                     s.cardWrap,
                     pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
                   ]}
                 >
                   <View style={s.card}>
                     <View style={s.cardTop}>
                       <Text style={s.cardTitle} numberOfLines={1}>
                         {item.title || 'Saved script'}
                       </Text>
                       <Text style={s.cardDate}>{formatDate(item.created_at)}</Text>
                     </View>


                     {item.structured?.regulate?.script ? (
                       <Text style={s.cardPreview} numberOfLines={2}>
                         "{item.structured.regulate.script}"
                       </Text>
                     ) : null}


                     <View style={s.cardFooter}>
                       <View style={s.metaRow}>
                         {item.trigger_label ? (
                           <View style={s.metaPill}>
                             <Text style={s.metaPillText}>{item.trigger_label}</Text>
                           </View>
                         ) : null}
                       </View>


                       <Pressable
                         onPress={() => handleDelete(item.id, item.title)}
                         hitSlop={12}
                         style={({ pressed }) => [pressed && { opacity: 0.5 }]}
                       >
                         <Text style={s.deleteText}>Delete</Text>
                       </Pressable>
                     </View>
                   </View>
                 </Pressable>
               ))}
             </View>
           ))}


           <Text style={s.footnote}>Tap any script to open it again.</Text>
         </ScrollView>
       )}
     </SafeAreaView>
   </View>
 );
}


// ═══════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════


function EmptyState() {
 return (
   <View style={s.emptyWrap}>
     <View style={s.emptyCard}>
       <View style={s.emptyIconWrap}>
         <Text style={s.emptyIcon}>🔖</Text>
       </View>
       <Text style={s.emptyTitle}>Nothing saved yet</Text>
       <Text style={s.emptyBody}>
         When a script helps, tap the bookmark to keep it here. Your saved moments group by child so you can find them easily.
       </Text>
     </View>


     <Pressable
       onPress={() => {
         Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
router.push('/(tabs)');       }}
       style={({ pressed }) => [s.emptyCta, pressed && { opacity: 0.9 }]}
     >
       <Text style={s.emptyCtaText}>Go to SOS</Text>
     </Pressable>
   </View>
 );
}


// ═══════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════


const s = StyleSheet.create({
 root: { flex: 1, backgroundColor: C.base },
 safe: { flex: 1 },


 // Blobs
 blob: { position: 'absolute', borderRadius: 999 },
 blob1: {
   top: -80, right: -60, width: 280, height: 280,
   backgroundColor: 'rgba(253, 221, 230, 0.55)',
 },
 blob2: {
   bottom: -60, left: -80, width: 240, height: 240,
   backgroundColor: 'rgba(212, 232, 209, 0.50)',
 },


 // Header
 header: {
   flexDirection: 'row',
   alignItems: 'center',
   paddingHorizontal: 24,
   paddingTop: 4,
 },
 backBtn: { paddingVertical: 6 },
 backText: {
   fontFamily: F.bodyMedium,
   fontSize: 15,
   color: C.textMuted,
 },


 // Title
 titleWrap: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16, gap: 4 },
 title: {
   fontFamily: F.heading,
   fontSize: 26,
   letterSpacing: -0.3,
   color: C.text,
 },
 subtitle: {
   fontFamily: F.body,
   fontSize: 14,
   color: C.textSub,
 },


 // Loading / error
 center: {
   flex: 1,
   alignItems: 'center',
   justifyContent: 'center',
   gap: 12,
   paddingHorizontal: 24,
 },
 errorText: {
   fontFamily: F.body,
   fontSize: 14,
   color: C.rose,
   textAlign: 'center',
 },
 retryText: {
   fontFamily: F.bodySemi,
   fontSize: 14,
   color: C.rose,
   textDecorationLine: 'underline',
 },


 // List
 scroll: {
   paddingHorizontal: 20,
   paddingBottom: 40,
 },


 // Group
 group: { marginBottom: 20 },
 groupHeader: {
   flexDirection: 'row',
   alignItems: 'baseline',
   justifyContent: 'space-between',
   paddingHorizontal: 4,
   marginBottom: 10,
 },
 groupName: {
   fontFamily: F.bodySemi,
   fontSize: 15,
   color: C.rose,
   letterSpacing: 0.2,
 },
 groupCount: {
   fontFamily: F.body,
   fontSize: 12,
   color: C.textMuted,
 },


 // Card
 cardWrap: { marginBottom: 10 },
 card: {
   borderRadius: 18,
   padding: 16,
   backgroundColor: C.cardGlass,
   borderWidth: 1,
   borderColor: C.border,
   gap: 8,
 },
 cardTop: {
   flexDirection: 'row',
   alignItems: 'center',
   justifyContent: 'space-between',
   gap: 8,
 },
 cardTitle: {
   fontFamily: F.bodySemi,
   fontSize: 15,
   color: C.text,
   flex: 1,
 },
 cardDate: {
   fontFamily: F.body,
   fontSize: 12,
   color: C.textMuted,
 },
 cardPreview: {
   fontFamily: F.scriptItalic,
   fontSize: 14,
   color: C.textBody,
   lineHeight: 21,
 },
 cardFooter: {
   flexDirection: 'row',
   alignItems: 'center',
   justifyContent: 'space-between',
   marginTop: 2,
 },
 metaRow: { flexDirection: 'row', gap: 8, flex: 1 },
 metaPill: {
   paddingHorizontal: 10,
   paddingVertical: 3,
   borderRadius: 10,
   backgroundColor: 'rgba(247,149,102,0.10)',
   borderWidth: 1,
   borderColor: 'rgba(247,149,102,0.18)',
 },
 metaPillText: {
   fontFamily: F.bodyMedium,
   fontSize: 11,
   color: C.peach,
 },
 deleteText: {
   fontFamily: F.bodyMedium,
   fontSize: 12,
   color: C.rose,
 },


 // Footnote
 footnote: {
   fontFamily: F.body,
   fontSize: 12,
   color: C.textMuted,
   textAlign: 'center',
   marginTop: 8,
 },


 // Empty state
 emptyWrap: {
   flex: 1,
   alignItems: 'center',
   justifyContent: 'center',
   paddingHorizontal: 24,
   gap: 20,
 },
 emptyCard: {
   width: '100%',
   backgroundColor: C.cardGlass,
   borderRadius: 24,
   borderWidth: 1,
   borderColor: C.border,
   padding: 28,
   alignItems: 'center',
   gap: 12,
 },
 emptyIconWrap: {
   width: 56,
   height: 56,
   borderRadius: 28,
   backgroundColor: C.roseMuted,
   alignItems: 'center',
   justifyContent: 'center',
   marginBottom: 4,
 },
 emptyIcon: { fontSize: 28 },
 emptyTitle: {
   fontFamily: F.bodySemi,
   fontSize: 18,
   color: C.text,
   textAlign: 'center',
 },
 emptyBody: {
   fontFamily: F.body,
   fontSize: 14,
   lineHeight: 21,
   color: C.textBody,
   textAlign: 'center',
   maxWidth: 260,
 },
 emptyCta: {
   backgroundColor: C.rose,
   paddingHorizontal: 28,
   paddingVertical: 14,
   borderRadius: 14,
   shadowColor: C.rose,
   shadowOpacity: 0.22,
   shadowRadius: 16,
   shadowOffset: { width: 0, height: 4 },
   elevation: 4,
 },
 emptyCtaText: {
   fontFamily: F.bodySemi,
   fontSize: 15,
   color: '#FFFFFF',
   letterSpacing: 0.2,
 },
});


