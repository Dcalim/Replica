import { useEffect, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import Button from "../Button";
import apiService from "../../services/apiService";
import { ApiError } from "../../services/axiosInterceptor";
import { showBanner } from "../../reducers/ui";
import { useAppDispatch } from "../../store/store";
import type { ScanRetentionDays } from "../../types/api";

const FOREVER_VALUE = "forever";

const toSelectValue = (days: ScanRetentionDays) =>
  days == null ? FOREVER_VALUE : String(days);

const fromSelectValue = (value: string): ScanRetentionDays =>
  value === FOREVER_VALUE ? null : Number(value);

const SettingsView = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [retentionDays, setRetentionDays] = useState<ScanRetentionDays>(null);
  const [options, setOptions] = useState<ScanRetentionDays[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    apiService
      .getSettings()
      .then((settings) => {
        if (cancelled) {
          return;
        }

        setRetentionDays(settings.scanRetentionDays);
        setOptions(settings.scanRetentionOptions);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : t("settingsView.loadErrorMessage"),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey, t]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  };

  const optionLabel = (days: ScanRetentionDays) =>
    days == null
      ? t("settingsView.retentionForever")
      : t("settingsView.retentionDays", { count: days });

  const handleRetentionChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const nextValue = fromSelectValue(event.target.value);
    const previousValue = retentionDays;

    setRetentionDays(nextValue);
    setIsSaving(true);

    try {
      const { pruned } = await apiService.updateScanRetention(nextValue);

      dispatch(
        showBanner({
          variant: "success",
          title: t("settingsView.saveSuccessTitle"),
          message:
            pruned.removedScans > 0
              ? t("settingsView.saveSuccessPruned", {
                  retention: optionLabel(nextValue),
                  count: pruned.removedScans,
                })
              : t("settingsView.saveSuccessMessage", {
                  retention: optionLabel(nextValue),
                }),
        }),
      );
    } catch (err) {
      setRetentionDays(previousValue);
      dispatch(
        showBanner({
          variant: "error",
          title: t("settingsView.saveErrorTitle"),
          message:
            err instanceof ApiError ? err.message : t("settingsView.saveErrorMessage"),
        }),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-8 lg:px-10">
      <div className="mb-6 text-left">
        <h1 className="font-['Sora'] text-2xl font-semibold text-slate-900">
          {t("settingsView.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t("settingsView.subtitle")}</p>
      </div>

      {isLoading ? (
        <p className="text-left text-sm text-slate-500">{t("settingsView.loading")}</p>
      ) : error ? (
        <div className="flex flex-col items-start">
          <p className="text-sm text-red-600">{error}</p>
          <Button
            variant="secondary"
            size="md"
            className="mt-4"
            onClick={handleRetry}
          >
            {t("settingsView.retry")}
          </Button>
        </div>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            {t("settingsView.storageHeading")}
          </h2>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-md">
              <label
                htmlFor="scan-retention"
                className="text-sm font-medium text-slate-900"
              >
                {t("settingsView.retentionLabel")}
              </label>
              <p className="mt-1 text-sm text-slate-500">
                {t("settingsView.retentionDescription")}
              </p>
            </div>

            <select
              id="scan-retention"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 sm:w-48"
              value={toSelectValue(retentionDays)}
              disabled={isSaving}
              onChange={(event) => void handleRetentionChange(event)}
            >
              {options.map((days) => (
                <option key={toSelectValue(days)} value={toSelectValue(days)}>
                  {optionLabel(days)}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            {t("settingsView.retentionNote")}
          </p>
        </section>
      )}
    </div>
  );
};

export default SettingsView;
