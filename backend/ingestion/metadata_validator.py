from typing import Literal
from pydantic import BaseModel, field_validator

VALID_NIVEAUX = {"TPS", "PS", "MS", "GS", "CP", "CE1", "CE2", "CM1", "CM2"}
VALID_DOMAINES = {
    "Français",
    "Mathématiques",
    "Sciences",
    "Histoire-Géographie",
    "Espace/Temps",
    "Arts Plastiques",
    "EPS",
    "EMC",
}
VALID_TYPES = {
    "Exercice",
    "Leçon",
    "Fiche de préparation",
    "Texte officiel",
    "Évaluation",
}
VALID_SOURCES = {"Eduscol", "MCP_Gouv", "Blog_Partenaire"}


class DocumentMetadata(BaseModel):
    cycle: Literal["Cycle 1", "Cycle 2", "Cycle 3"]
    niveau: str
    domaine: str
    type_ressource: str
    source: str
    filename: str
    page_number: int

    @field_validator("niveau")
    @classmethod
    def validate_niveau(cls, v: str) -> str:
        if v not in VALID_NIVEAUX:
            raise ValueError(f"Invalid niveau '{v}'. Valid: {sorted(VALID_NIVEAUX)}")
        return v

    @field_validator("domaine")
    @classmethod
    def validate_domaine(cls, v: str) -> str:
        if v not in VALID_DOMAINES:
            raise ValueError(f"Invalid domaine '{v}'. Valid: {sorted(VALID_DOMAINES)}")
        return v

    @field_validator("type_ressource")
    @classmethod
    def validate_type_ressource(cls, v: str) -> str:
        if v not in VALID_TYPES:
            raise ValueError(f"Invalid type_ressource '{v}'. Valid: {sorted(VALID_TYPES)}")
        return v

    @field_validator("source")
    @classmethod
    def validate_source(cls, v: str) -> str:
        if v not in VALID_SOURCES:
            raise ValueError(f"Invalid source '{v}'. Valid: {sorted(VALID_SOURCES)}")
        return v
