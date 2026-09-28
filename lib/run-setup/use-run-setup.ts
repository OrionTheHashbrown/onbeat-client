/**
 * LET'S RUN SHEET LOGIC – lib/run-setup/use-run-setup.ts
 *
 */

import { useEffect, useState } from 'react';
import { listRuns } from '../api/runs';
import { analyseSongs } from '../api/tracks';
import { getErrorMessage } from '../errors';
import { fetchPlaylistSongs, Song } from '../spotify/playlists';
import { useSpotify } from '../spotify/spotify-provider';
import { calculateBaselineSpm } from '../tempo/baseline';
import { orderSongsForPlan } from '../tempo/order';
import { buildTempoPlan, defaultBaselineSpm } from '../tempo/plan';
import { defaultChoices, DropCallouts, loadRunChoices, RunChoices, saveRunChoices } from './saved-choices';
import { startRun } from './start-run';

export type LoadingStep = 'playlist' | 'tempo' | null;

const shortestGoal = 5;
const longestGoal = 180;
const goalStep = 5;

export function useRunSetup() {
  const spotify = useSpotify();
  const [choices, setChoices] = useState<RunChoices>(defaultChoices);
  const [hasLoadedChoices, setHasLoadedChoices] = useState(false);
  const [baselineSpm, setBaselineSpm] = useState(defaultBaselineSpm);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loadedPlaylistId, setLoadedPlaylistId] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shuffleNumber, setShuffleNumber] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [clearingSongCount, setClearingSongCount] = useState<number | null>(null); // null = not clearing
  const [startError, setStartError] = useState<string | null>(null);
  const [startWarning, setStartWarning] = useState<string | null>(null);
  const [musicAlreadyStarted, setMusicAlreadyStarted] = useState(false);
  const plan = buildTempoPlan(choices.goalMinutes, baselineSpm);
  const order = orderSongsForPlan(songs, plan, shuffleNumber);

  useEffect(() => {
    loadRunChoices().then((savedChoices) => {
      setChoices(savedChoices);
      setHasLoadedChoices(true);
    });

    listRuns(12)
      .then((runs) => setBaselineSpm(calculateBaselineSpm(runs)))
      .catch((error) => console.warn('[run-setup] could not load past runs:', getErrorMessage(error)));
  }, []);

  // LOAD the playlist once Spotify is connected (and again whenever they pick a different one)
  useEffect(() => {
    if (spotify.status !== 'connected' || !hasLoadedChoices) {
      return;
    }
    if (loadedPlaylistId === choices.playlistId) {
      return;
    }
    loadPlaylist(choices.playlistId);
  }, [spotify.status, hasLoadedChoices, choices.playlistId, loadedPlaylistId]);

  async function loadPlaylist(playlistId: string) {
    setLoadedPlaylistId(playlistId);
    setLoadError(null);
    setSongs([]);

    try {
      // STEP 1 – songs from Spotify
      setLoadingStep('playlist');
      const accessToken = await spotify.getAccessToken();
      if (!accessToken) {
        throw new Error('Please sign in to Spotify again.');
      }
      const playlistSongs = await fetchPlaylistSongs(accessToken, playlistId);
      setSongs(playlistSongs);

      // STEP 2 – BPM, energy and beat drops from our backend
      setLoadingStep('tempo');
      try {
        const analysedSongs = await analyseSongs(playlistSongs);
        setSongs(analysedSongs);
      } catch (error) {
        console.warn('[run-setup] could not analyse songs:', getErrorMessage(error));
      }
    } catch (error) {
      setLoadError(getErrorMessage(error));
    }
    setLoadingStep(null);
  }

  function updateChoices(newChoices: RunChoices) {
    setChoices(newChoices);
    saveRunChoices(newChoices);
    forgetStartAttempt();
  }

  function forgetStartAttempt() {
    setMusicAlreadyStarted(false);
    setStartWarning(null);
    setStartError(null);
  }

  // MOVE the goal up or down by 5 minutes, staying between 5 and 180
  function handleGoalButton(direction: 'up' | 'down') {
    let newGoal = choices.goalMinutes;
    if (direction === 'up') {
      newGoal += goalStep;
    } else {
      newGoal -= goalStep;
    }
    if (newGoal < shortestGoal) {
      newGoal = shortestGoal;
    }
    if (newGoal > longestGoal) {
      newGoal = longestGoal;
    }
    updateChoices({ ...choices, goalMinutes: newGoal });
  }

  function choosePlaylist(playlistId: string, playlistName: string) {
    if (playlistId === choices.playlistId) {
      return;
    }
    setShuffleNumber(0);
    updateChoices({ ...choices, playlistId, playlistName });
  }

  function handleDropCalloutButton(dropCallouts: DropCallouts) {
    setChoices({ ...choices, dropCallouts });
    saveRunChoices({ ...choices, dropCallouts });
  }

  function handleShuffleButton() {
    setShuffleNumber(shuffleNumber + 1);
    forgetStartAttempt();
  }

  function handleTryAgainButton() {
    loadPlaylist(choices.playlistId);
  }

  async function handleStartButton() {
    if (isStarting || order.orderedSongs.length === 0) {
      return;
    }
    setIsStarting(true);
    setStartError(null);

    try {
      const result = await startRun({
        orderedSongs: order.orderedSongs,
        spareSongs: order.spareSongs,
        plan,
        goalMinutes: choices.goalMinutes,
        playlistId: choices.playlistId,
        dropCallouts: choices.dropCallouts,
        getAccessToken: spotify.getAccessToken,
        onClearingQueue: setClearingSongCount,
        musicAlreadyStarted,
        ignoreWarnings: startWarning !== null,
      });

      if (result.outcome === 'warning') {
        setMusicAlreadyStarted(true);
        setStartWarning(result.message);
      }
    } catch (error) {
      setStartError(getErrorMessage(error));
    }
    setClearingSongCount(null);
    setIsStarting(false);
  }

  return {
    spotify,
    choices,
    plan,
    orderedSongs: order.orderedSongs,
    orderedMs: order.totalMs,
    loadingStep,
    loadError,
    isStarting,
    clearingSongCount,
    startError,
    startWarning,
    handleGoalButton,
    choosePlaylist,
    handleDropCalloutButton,
    handleShuffleButton,
    handleTryAgainButton,
    handleStartButton,
  };
}
