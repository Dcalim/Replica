import { useAppSelector } from "../../store/store";
import { MODAL_VIEWS } from "../../models/constant";
import ImagePreviewModal from "./Modals/ImagePreviewModal";

const ModalManager = () => {
  const modalView = useAppSelector((state) => state.ui.modalView);

  switch (modalView) {
    case MODAL_VIEWS.PREVIEW:
      return <ImagePreviewModal />;
    default:
      return null;
  }
};

export default ModalManager;
