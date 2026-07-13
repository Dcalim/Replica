import { useAppSelector } from "../store/store";
import { MODAL_VIEWS } from "../models/constant";
import ImagePreviewModal from "./ImagePreviewModal";
import SettingsModal from "./Views/SettingsModal";

const ModalManager = () => {
  const modalView = useAppSelector((state) => state.ui.modalView);

  switch (modalView) {
    case MODAL_VIEWS.SETTINGS:
      return <SettingsModal />;
    case MODAL_VIEWS.PREVIEW:
      return <ImagePreviewModal />;
    default:
      return null;
  }
};

export default ModalManager;
