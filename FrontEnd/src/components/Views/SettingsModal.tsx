import { useTranslation } from "react-i18next";
import Modal from "../Modal";
import { closeModal } from "../../reducers/ui";
import { useAppDispatch } from "../../store/store";

const SettingsModal = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  return (
    <Modal
      show
      heading={t("settingsModal.heading")}
      onClose={() => dispatch(closeModal())}
    >
      <p>{t("settingsModal.description")}</p>
    </Modal>
  );
};

export default SettingsModal;
