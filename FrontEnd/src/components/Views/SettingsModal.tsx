import { useTranslation } from "react-i18next";
import Modal from "../Modal";
import { setShowSettingsModal } from "../../reducers/ui";
import { useAppDispatch, useAppSelector } from "../../store/store";

const SettingsModal = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const showSettingsModal = useAppSelector((state) => state.ui.showSettingsModal);

  return (
    <Modal
      show={showSettingsModal}
      heading={t("settingsModal.heading")}
      onClose={() => dispatch(setShowSettingsModal(false))}
    >
      <p>{t("settingsModal.description")}</p>
    </Modal>
  );
};

export default SettingsModal;
