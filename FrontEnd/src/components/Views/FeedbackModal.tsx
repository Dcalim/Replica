import { useTranslation } from "react-i18next";
import Modal from "../Modal";
import { setShowFeedbackModal } from "../../reducers/ui";
import { useAppDispatch, useAppSelector } from "../../store/store";

const FeedbackModal = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const showFeedbackModal = useAppSelector((state) => state.ui.showFeedbackModal);

  return (
    <div>
      <Modal show={showFeedbackModal} heading={t("feedbackModal.title")} onClose={() => dispatch(setShowFeedbackModal(false))}>
        "Content"
      </Modal>
    </div>
  )
}

export default FeedbackModal;
