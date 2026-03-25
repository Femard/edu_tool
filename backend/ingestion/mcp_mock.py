"""Mock connector for the French government MCP (Model Context Protocol).

In production this would query the real MCP endpoint for official educational
documents (programmes, socle commun, etc.).
"""

from dataclasses import dataclass
from typing import Iterator


@dataclass
class MockDocument:
    content: str
    metadata: dict


def fetch_mock_documents() -> Iterator[MockDocument]:
    """Yield pre-labelled fictional educational documents for testing."""

    yield MockDocument(
        content=(
            "La soustraction est une opération mathématique qui consiste à retirer "
            "une quantité d'une autre. Par exemple : 8 - 3 = 5. "
            "Exercice 1 : Complète les soustractions suivantes. "
            "7 - 4 = ___ ; 10 - 6 = ___ ; 15 - 9 = ___."
        ),
        metadata={
            "cycle": "Cycle 2",
            "niveau": "CE1",
            "domaine": "Mathématiques",
            "type_ressource": "Exercice",
            "source": "MCP_Gouv",
            "filename": "mock_soustraction_ce1.txt",
            "page_number": 1,
        },
    )

    yield MockDocument(
        content=(
            "Le cycle de l'eau : L'eau existe sous trois états — solide (glace), "
            "liquide (eau) et gazeux (vapeur d'eau). Le soleil chauffe l'eau des "
            "océans qui s'évapore, monte dans l'atmosphère, forme des nuages, puis "
            "retombe sous forme de pluie ou de neige. C'est le cycle de l'eau."
        ),
        metadata={
            "cycle": "Cycle 2",
            "niveau": "CE2",
            "domaine": "Sciences",
            "type_ressource": "Leçon",
            "source": "MCP_Gouv",
            "filename": "mock_cycle_eau_ce2.txt",
            "page_number": 1,
        },
    )

    yield MockDocument(
        content=(
            "Les programmes du cycle 1 précisent que les enfants doivent acquérir "
            "le langage oral comme pivot de tous les apprentissages. Les activités "
            "de phonologie permettent de sensibiliser les élèves aux sons de la "
            "langue française avant l'entrée en lecture."
        ),
        metadata={
            "cycle": "Cycle 1",
            "niveau": "GS",
            "domaine": "Français",
            "type_ressource": "Texte officiel",
            "source": "MCP_Gouv",
            "filename": "mock_programme_cycle1_francais.txt",
            "page_number": 1,
        },
    )

    yield MockDocument(
        content=(
            "Fiche de préparation — Séquence géométrie CM1. "
            "Objectif : reconnaître et tracer des figures géométriques simples "
            "(carré, rectangle, triangle, cercle). "
            "Séance 1 : observation et tri de figures. "
            "Séance 2 : reproduction sur papier quadrillé. "
            "Séance 3 : construction à la règle et au compas."
        ),
        metadata={
            "cycle": "Cycle 3",
            "niveau": "CM1",
            "domaine": "Mathématiques",
            "type_ressource": "Fiche de préparation",
            "source": "MCP_Gouv",
            "filename": "mock_geometrie_cm1.txt",
            "page_number": 1,
        },
    )

    yield MockDocument(
        content=(
            "Évaluation — Lecture CP. "
            "Lis le texte puis réponds aux questions. "
            "« Le chat de Léa s'appelle Minou. Il est tout noir avec des yeux verts. "
            "Il aime dormir sur le canapé. » "
            "Question 1 : Comment s'appelle le chat ? "
            "Question 2 : De quelle couleur est-il ?"
        ),
        metadata={
            "cycle": "Cycle 2",
            "niveau": "CP",
            "domaine": "Français",
            "type_ressource": "Évaluation",
            "source": "MCP_Gouv",
            "filename": "mock_evaluation_lecture_cp.txt",
            "page_number": 1,
        },
    )
