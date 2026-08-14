import { useEffect } from "react";
import Banner from "./Banner";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { clearBanner } from "../../reducers/ui";

const AUTO_DISMISS_MS = 5000;

const BannerManager = () => {
  const dispatch = useAppDispatch();
  const banner = useAppSelector((state) => state.ui.banner);

  useEffect(() => {
    if (!banner) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch(clearBanner());
    }, AUTO_DISMISS_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [banner, dispatch]);

  if (!banner) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:px-6">
      <div className="pointer-events-auto w-full max-w-xl">
        <Banner
          variant={banner.variant}
          title={banner.title}
          onClose={() => dispatch(clearBanner())}
        >
          {banner.message}
        </Banner>
      </div>
    </div>
  );
};

export default BannerManager;
