import { useTranslation } from "react-i18next";
import Modal from "../Modal";
import { setModalView } from "../../reducers/ui";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { MODAL_VIEWS } from "../../models/constant";

const SettingsModal = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const modalView = useAppSelector((state) => state.ui.modalView);

  return (
    <Modal
      show={modalView === MODAL_VIEWS.SETTINGS}
      heading={t("settingsModal.heading")}
      onClose={() => dispatch(setModalView(MODAL_VIEWS.NONE))}
    >
      <p>{t("settingsModal.description")}</p>
    </Modal>
  );
};

export default SettingsModal;
