import 'dashboard_models.dart';

/// Modèles pour la gestion des dépenses
class Depense {
  final int id;
  final Transaction transaction;
  final String categorieDepense;
  final String categorieDepenseDisplay;
  final String? fournisseur;
  final String? numeroFacture;

  Depense({
    required this.id,
    required this.transaction,
    required this.categorieDepense,
    required this.categorieDepenseDisplay,
    this.fournisseur,
    this.numeroFacture,
  });

  factory Depense.fromJson(Map<String, dynamic> json) {
    return Depense(
      id: parseInt(json['id']),
      transaction: Transaction.fromJson(json['transaction']),
      categorieDepense: json['categorie_depense']?.toString() ?? '',
      categorieDepenseDisplay:
          json['categorie_depense_display']?.toString() ??
          json['categorie_depense']?.toString() ??
          '',
      fournisseur: json['fournisseur']?.toString(),
      numeroFacture: json['numero_facture']?.toString(),
    );
  }
}

class Transaction {
  final int id;
  final String description;
  final double montant;
  final DateTime dateTransaction;
  final String typeTransaction;

  Transaction({
    required this.id,
    required this.description,
    required this.montant,
    required this.dateTransaction,
    required this.typeTransaction,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: parseInt(json['id']),
      description: json['description']?.toString() ?? '',
      montant: parseDouble(json['montant']),
      dateTransaction:
          DateTime.tryParse(json['date_transaction']?.toString() ?? '') ??
          DateTime.now(),
      typeTransaction: json['type_transaction']?.toString() ?? 'DEPENSE',
    );
  }
}

class CategorieDepense {
  final String value;
  final String label;

  CategorieDepense({required this.value, required this.label});

  factory CategorieDepense.fromJson(Map<String, dynamic> json) {
    return CategorieDepense(value: json['value'], label: json['label']);
  }
}

/// Résultat de la liste des dépenses
class DepensesListResult {
  final bool success;
  final List<Depense> depenses;
  final int count;
  final String? error;

  DepensesListResult({
    required this.success,
    this.depenses = const [],
    this.count = 0,
    this.error,
  });
}

/// Résultat d'une opération sur une dépense
class DepenseOperationResult {
  final bool success;
  final Depense? depense;
  final String? error;

  DepenseOperationResult({required this.success, this.depense, this.error});
}

/// Résultat des catégories de dépenses
class CategoriesDepenseResult {
  final bool success;
  final List<CategorieDepense> categories;
  final String? error;

  CategoriesDepenseResult({
    required this.success,
    this.categories = const [],
    this.error,
  });
}
