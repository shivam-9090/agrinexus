from app.services.crop_recommender import recommend_crops


def test_recommend_crops_returns_ranked_list():
    results = recommend_crops(
        nitrogen=100, phosphorus=45, potassium=45, ph=6.2,
        temperature=26, humidity=80, rainfall=200,
    )
    assert len(results) == 3
    assert results[0].confidence >= results[1].confidence >= results[2].confidence
    assert all(0 <= r.confidence <= 1 for r in results)


def test_rice_like_conditions_favor_rice():
    results = recommend_crops(
        nitrogen=100, phosphorus=45, potassium=45, ph=6.2,
        temperature=27, humidity=85, rainfall=220,
    )
    top_crops = {r.crop for r in results}
    assert "rice" in top_crops
