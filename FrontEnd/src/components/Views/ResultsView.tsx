import Button from "../Button";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../models/constant";
import { useTranslation } from "react-i18next";

const ResultsView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('resultsView.title')}</h1>
      <Button variant="primary" size="md" onClick={() => navigate(ROUTES.SCAN)}>
        {t('resultsView.backButton')}
      </Button>
    </div>
  )
}

export default ResultsView
