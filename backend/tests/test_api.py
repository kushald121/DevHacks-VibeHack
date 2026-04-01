import unittest

import main
from fastapi.testclient import TestClient


async def _fake_call_openrouter(*, system, messages, agent_name=None, max_tokens=1800):
    text = f"[{agent_name or 'generic'}] synthetic response"
    if "timeline analysis expert" in system.lower():
        text = '{"immediate":{"impacts":["cash outflow"],"probability":"medium"}}'
    return {"content": text, "input_tokens": 10, "output_tokens": 20}


class BackendAPITest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Patch OpenRouter calls to keep tests deterministic/offline.
        import agents.agent_orchestrator as orchestrator_module
        import utils.timeline_analysis as timeline_module

        orchestrator_module.call_openrouter = _fake_call_openrouter
        timeline_module.call_openrouter = _fake_call_openrouter

        cls.client = TestClient(main.app)

    def setUp(self):
        main.sessions.clear()

    def test_health_endpoint(self):
        resp = self.client.get("/health")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("ok", resp.json())

    def test_run_workflow_demo(self):
        payload = {"session_id": "s1", "input": "Should I take a gap year?", "demo_scenario": "gap_year"}
        resp = self.client.post("/api/decision/run", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("outputs", data)
        self.assertIn("synthesis", data["outputs"])
        self.assertIn("confidence", data)
        self.assertIn("riskLevel", data)

    def test_run_workflow_live_mocked(self):
        payload = {"session_id": "s2", "input": "Should I switch careers?"}
        resp = self.client.post("/api/decision/run", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(set(data["outputs"].keys()), {"breakdown", "research", "framework", "redTeam", "synthesis"})

    def test_interaction_endpoints(self):
        self.client.post("/api/decision/run", json={"session_id": "s3", "input": "Test decision"})

        refine = self.client.post(
            "/api/decision/refine",
            json={"session_id": "s3", "agent_name": "breakdown", "feedback": "Add financial details"},
        )
        self.assertEqual(refine.status_code, 200)

        explain = self.client.post(
            "/api/decision/node-explain",
            json={"session_id": "s3", "node_id": "Option A", "confidence": 62},
        )
        self.assertEqual(explain.status_code, 200)

        simulate = self.client.post("/api/decision/simulate", json={"session_id": "s3", "scenario": "Recession"})
        self.assertEqual(simulate.status_code, 200)

        compare = self.client.post(
            "/api/decision/compare",
            json={"session_id": "s3", "option_a": "Move city", "option_b": "Stay put"},
        )
        self.assertEqual(compare.status_code, 200)

    def test_timeline_and_session_state(self):
        self.client.post("/api/decision/run", json={"session_id": "s4", "input": "Start a startup?"})

        timeline = self.client.post("/api/decision/timeline", json={"session_id": "s4", "decision": "Start startup"})
        self.assertEqual(timeline.status_code, 200)
        self.assertIn("timeline", timeline.json())

        state = self.client.get("/api/session/s4")
        self.assertEqual(state.status_code, 200)
        body = state.json()
        self.assertIn("state", body)
        self.assertIn("history", body["state"])

        imported = self.client.post("/api/session/import", json={"session_id": "s5", "state": body["state"]})
        self.assertEqual(imported.status_code, 200)

        deleted = self.client.delete("/api/session/s4")
        self.assertEqual(deleted.status_code, 200)

    def test_run_stream_sse(self):
        with self.client.stream(
            "POST",
            "/api/decision/run-stream",
            json={"session_id": "s_stream", "input": "Test streaming"},
        ) as resp:
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp.headers.get("content-type"), "text/event-stream; charset=utf-8")
            chunks = []
            for chunk in resp.iter_text():
                chunks.append(chunk)
                if "workflow_complete" in chunk:
                    break
            body = "".join(chunks)
            self.assertIn("agent_start", body)
            self.assertIn("workflow_complete", body)


if __name__ == "__main__":
    unittest.main()
