from app.services import federation


def setup_function(_):
    # federation module holds process-global in-memory state; reset between tests
    federation._nodes.clear()
    federation._insights.clear()


def test_register_node_and_list():
    node = federation.register_node(
        federation.FederationNode(node_id="br-mg-01", country="Brazil", region="Minas Gerais")
    )
    assert node.node_id == "br-mg-01"
    assert len(federation.list_nodes()) == 1


def test_register_node_overwrites_same_id():
    federation.register_node(federation.FederationNode(node_id="n1", country="India", region="Bihar"))
    federation.register_node(federation.FederationNode(node_id="n1", country="India", region="Punjab"))
    nodes = federation.list_nodes()
    assert len(nodes) == 1
    assert nodes[0].region == "Punjab"


def test_submit_insight_and_filter_by_crop_and_country():
    federation.submit_insight("n1", "India", "Punjab", "wheat", 80.0, "legume rotation", 50)
    federation.submit_insight("n2", "Brazil", "Minas Gerais", "maize", 70.0, "cover cropping", 40)

    wheat_only = federation.list_insights(crop="wheat")
    assert len(wheat_only) == 1
    assert wheat_only[0].country == "India"

    brazil_only = federation.list_insights(country="Brazil")
    assert len(brazil_only) == 1
    assert brazil_only[0].crop == "maize"

    assert federation.list_insights(crop="rice") == []


def test_network_stats_counts_unique_countries():
    federation.register_node(federation.FederationNode(node_id="n1", country="India", region="Punjab"))
    federation.register_node(federation.FederationNode(node_id="n2", country="India", region="Bihar"))
    federation.register_node(federation.FederationNode(node_id="n3", country="Brazil", region="Minas Gerais"))
    federation.submit_insight("n1", "India", "Punjab", "wheat", 80.0, "legume rotation", 50)

    stats = federation.network_stats()
    assert stats["registered_nodes"] == 3
    assert stats["participating_countries"] == ["Brazil", "India"]
    assert stats["total_insights_shared"] == 1
