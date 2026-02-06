export type BuildFingerprint = {
  displayLabel: string;
  metaContent: string;
  shortSha: string | null;
  environment: string | null;
  deploymentId: string | null;
  commitRef: string | null;
};

export function getBuildFingerprint(): BuildFingerprint {
  const commitSha = import.meta.env.VERCEL_GIT_COMMIT_SHA as string | undefined;
  const environment = import.meta.env.VERCEL_ENV as string | undefined;
  const deploymentId = import.meta.env.VERCEL_DEPLOYMENT_ID as string | undefined;
  const commitRef = import.meta.env.VERCEL_GIT_COMMIT_REF as string | undefined;

  if (!commitSha) {
    return {
      displayLabel: 'Build: local',
      metaContent: 'local',
      shortSha: null,
      environment: null,
      deploymentId: deploymentId ?? null,
      commitRef: commitRef ?? null,
    };
  }

  const shortSha = commitSha.slice(0, 7);
  const envLabel = environment ?? 'unknown';

  return {
    displayLabel: `Build ${shortSha} · ${envLabel}`,
    metaContent: `${shortSha}|${envLabel}`,
    shortSha,
    environment: envLabel,
    deploymentId: deploymentId ?? null,
    commitRef: commitRef ?? null,
  };
}
